// PURPOSE: Service class that manages game match persistence — creating matches, saving moves, updating results.
// IMPACT: The bridge between real-time WebSocket events and the database. Every move and game outcome is persisted here.
//         Without this, match history, replay, and PGN features would not have any data.
// ALTERNATIVE: Use event-driven architecture with Spring Events or a message queue for async persistence.
package com.chess.service;

// PURPOSE: Imports the Match JPA entity.
import com.chess.model.Match;

// PURPOSE: Imports the MatchMove JPA entity.
import com.chess.model.MatchMove;

// PURPOSE: Imports the MoveRequest DTO — carries move data from the WebSocket controller.
import com.chess.model.MoveRequest;

// PURPOSE: Imports MatchMoveRepository for persisting individual moves.
import com.chess.repository.MatchMoveRepository;

// PURPOSE: Imports MatchRepository for creating/updating match records.
import com.chess.repository.MatchRepository;

// PURPOSE: Imports UserRepository for looking up User entities by ID.
import com.chess.repository.UserRepository;

// PURPOSE: Imports @Autowired for dependency injection.
import org.springframework.beans.factory.annotation.Autowired;

// PURPOSE: Imports @Service — marks this class as a business logic component in Spring's IoC container.
// IMPACT: Spring creates a singleton instance of this class and makes it available for @Autowired injection.
// ALTERNATIVE: @Component (functionally identical, but @Service conveys "business logic" semantic).
import org.springframework.stereotype.Service;

// PURPOSE: Imports @Transactional — wraps method execution in a database transaction.
// IMPACT: Ensures atomicity: if any DB operation in the method fails, ALL changes are rolled back.
//         Also keeps the Hibernate session open for the method's duration, preventing LazyInitializationException.
// ALTERNATIVE: Manual transaction management with TransactionTemplate or PlatformTransactionManager.
import org.springframework.transaction.annotation.Transactional;

// PURPOSE: @Service registers this class as a Spring-managed service bean.
@Service
public class GameHistoryService { // Handles all match data persistence — the "write side" of match history.

    // PURPOSE: Registers a player in a match when they join a game room via WebSocket.
    // IMPACT: Links the User entity to the Match as white or black player.
    //         @Transactional ensures the find-or-create + player assignment is atomic.
    //         Called by ChessController.joinRoom() when a player connects to a game room.
    // ALTERNATIVE: Register players lazily on their first move instead of on room join.
    @Transactional
    public void registerPlayer(String gameId, String userId) {
        // PURPOSE: Guard clause — skips registration for null or "undefined" user IDs.
        // IMPACT: Prevents errors when anonymous users or malformed requests arrive.
        //         "undefined" can happen when the frontend sends userId before the user state is initialized.
        // ALTERNATIVE: Validate at the controller level before calling this method.
        if (userId == null || userId.equals("undefined")) return;
        
        // PURPOSE: Finds an existing match by gameId, or creates a new one if none exists.
        // IMPACT: The .filter() ensures we only reuse matches that are still "IN_PROGRESS" (not completed).
        //         .orElseGet() creates and saves a new Match if no active match exists for this gameId.
        //         This pattern is called "find-or-create" and is common in database operations.
        // ALTERNATIVE: Use matchRepository.findByGameIdAndResult(gameId, "IN_PROGRESS") for a cleaner query.
        Match match = matchRepository.findByGameId(gameId)
            .filter(m -> m.getResult() == null || m.getResult().equals("IN_PROGRESS"))
            .orElseGet(() -> {
                // PURPOSE: Creates a new Match entity when no active match exists for this gameId.
                Match newMatch = new Match();
                newMatch.setGameId(gameId);       // Links the match to the room code.
                newMatch.setResult("IN_PROGRESS"); // Initial state — game hasn't ended yet.
                return matchRepository.save(newMatch); // Persists to DB and returns with auto-generated ID.
            });

        // PURPOSE: Looks up the User entity by their numeric database ID.
        // IMPACT: Parses the userId string to Long, then queries: SELECT * FROM users WHERE id = ?
        //         .ifPresent() only proceeds if the user exists in the database.
        // ALTERNATIVE: Use Long.parseLong() with try-catch for NumberFormatException safety.
        userRepository.findById(Long.parseLong(userId)).ifPresent(user -> {
            // PURPOSE: Assigns the joining player to the first available slot (white or black).
            // IMPACT: First joiner gets white, second gets black. This determines board orientation in multiplayer.
            if (match.getWhitePlayer() == null) {
                // PURPOSE: First player to join becomes white.
                match.setWhitePlayer(user);
                matchRepository.save(match); // Persists the player assignment.
            } else if (match.getBlackPlayer() == null && !match.getWhitePlayer().getId().equals(user.getId())) {
                // PURPOSE: Second player (different from white) becomes black.
                // IMPACT: The ID check prevents the SAME player from being both white and black (e.g., on reconnect).
                match.setBlackPlayer(user);
                matchRepository.save(match); // Persists the player assignment.
            }
            // If both slots are filled, or user is already assigned, nothing happens (idempotent).
        });
    }

    // PURPOSE: Injects MatchRepository for match CRUD operations.
    // IMPACT: Used in registerPlayer(), saveMove(), and updateResult().
    // ALTERNATIVE: Constructor injection (recommended for immutability and testability).
    @Autowired
    private MatchRepository matchRepository;

    // PURPOSE: Injects MatchMoveRepository for persisting individual chess moves.
    @Autowired
    private MatchMoveRepository matchMoveRepository;
    
    // PURPOSE: Injects UserRepository for looking up User entities by ID.
    @Autowired
    private UserRepository userRepository;

    // PURPOSE: Persists a chess move to the database, linked to the appropriate match.
    // IMPACT: Called for EVERY move in every game — creates a MatchMove record in the "match_moves" table.
    //         @Transactional ensures the match lookup/creation and move save are atomic.
    //         If the match doesn't exist yet, it's created on-the-fly.
    // ALTERNATIVE: Batch moves and persist them all at game end (reduces DB writes but risks data loss on crashes).
    @Transactional
    public void saveMove(String gameId, MoveRequest move) {
        // PURPOSE: Finds or creates the match session — identical pattern to registerPlayer().
        // IMPACT: Ensures a Match record exists before saving moves to it.
        //         Duplicate code with registerPlayer() — could be extracted to a private findOrCreateMatch() method.
        // ALTERNATIVE: Extract to: private Match findOrCreateMatch(String gameId) { ... }
        Match match = matchRepository.findByGameId(gameId)
            .filter(m -> m.getResult() == null || m.getResult().equals("IN_PROGRESS"))
            .orElseGet(() -> {
                Match newMatch = new Match();
                newMatch.setGameId(gameId);
                newMatch.setResult("IN_PROGRESS");
                return matchRepository.save(newMatch);
            });

        // PURPOSE: Assigns the player who made this move to the appropriate color slot if not yet assigned.
        // IMPACT: Serves as a fallback player registration — if registerPlayer() wasn't called (e.g., for AI games).
        //         Uses the move's color ("w"/"b") to determine which slot to fill.
        // ALTERNATIVE: Remove this and rely solely on registerPlayer() for player assignment.
        if (move.getUserId() != null) {
            userRepository.findById(move.getUserId()).ifPresent(user -> {
                // PURPOSE: If this is a white move and white player isn't set, assign this user as white.
                if (move.getColor().equals("w") && match.getWhitePlayer() == null) {
                    match.setWhitePlayer(user);
                    matchRepository.save(match);
                // PURPOSE: If this is a black move and black player isn't set, assign this user as black.
                } else if (move.getColor().equals("b") && match.getBlackPlayer() == null) {
                    match.setBlackPlayer(user);
                    matchRepository.save(match);
                }
            });
        }

        // PURPOSE: Creates a new MatchMove entity to record this move in the database.
        // IMPACT: Each field is mapped from the MoveRequest DTO to the MatchMove entity.
        MatchMove matchMove = new MatchMove();
        matchMove.setMatch(match);                        // Links this move to its parent match (FK relationship).
        matchMove.setFromSquare(move.getFrom());          // Source square (e.g., "e2").
        matchMove.setToSquare(move.getTo());              // Destination square (e.g., "e4").
        matchMove.setSan(move.getSan());                  // SAN notation (e.g., "e4") — used in PGN and history display.
        matchMove.setPiece(move.getPiece());               // Piece type (e.g., "p" for pawn).
        matchMove.setColor(move.getColor());               // Move color ("w" or "b").

        // PURPOSE: Sets the move number based on the current count of moves in the match.
        // IMPACT: Determines the chronological order for replays and PGN generation.
        //         match.getMoves().size() + 1 gives the next sequential number.
        //         WARNING: This relies on the lazy-loaded moves list — works inside @Transactional.
        // ALTERNATIVE: Use an auto-incrementing counter or query matchMoveRepository.countByMatch(match) + 1.
        matchMove.setMoveNumber(match.getMoves().size() + 1);
        
        // PURPOSE: Persists the move to the "match_moves" table.
        // IMPACT: Executes: INSERT INTO match_moves (match_id, from_square, to_square, san, ...) VALUES (...)
        matchMoveRepository.save(matchMove);
    }

    // PURPOSE: Updates the result of a match when the game ends (checkmate, resignation, draw, timeout).
    // IMPACT: Changes the match record from "IN_PROGRESS" to the final result (e.g., "WHITE_WIN").
    //         @Transactional ensures the update is atomic.
    //         Called by ChessController.handleResult() when a player sends a result message.
    // ALTERNATIVE: Accept a structured result object with winner ID, reason (checkmate/resign/timeout), etc.
    @Transactional
    public void updateResult(String gameId, String result) {
        // PURPOSE: Finds the match by gameId and updates its result field.
        // IMPACT: .ifPresent() ensures no action is taken if the match doesn't exist (silent failure).
        //         Executes: UPDATE matches SET result = ? WHERE game_id = ?
        // ALTERNATIVE: Throw an exception if the match isn't found, or return a boolean success indicator.
        matchRepository.findByGameId(gameId).ifPresent(match -> {
            match.setResult(result);   // Sets the game outcome (e.g., "WHITE_WIN", "BLACK_WIN", "DRAW").
            matchRepository.save(match); // Persists the updated result to the database.
        });
    }
}
