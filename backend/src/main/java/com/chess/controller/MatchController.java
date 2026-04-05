// PURPOSE: REST controller for match-related endpoints — retrieves match history and generates PGN downloads.
// IMPACT: Provides the /api/matches/* endpoints consumed by the frontend's History tab and PGN download feature.
//         Without this, players cannot view past matches or download games for external analysis.
// ALTERNATIVE: GraphQL API for flexible query patterns, or include match data in the WebSocket stream.
package com.chess.controller;

// PURPOSE: Imports the Match JPA entity — represents a chess match record in the database.
import com.chess.model.Match;

// PURPOSE: Imports the MatchMove JPA entity — represents a single move within a match.
import com.chess.model.MatchMove;

// PURPOSE: Imports MatchRepository — database access for Match entities.
import com.chess.repository.MatchRepository;

// PURPOSE: Imports MatchMoveRepository — database access for MatchMove entities.
import com.chess.repository.MatchMoveRepository;

// PURPOSE: Imports UserRepository — database access for User entities (needed to look up users by ID).
import com.chess.repository.UserRepository;

// PURPOSE: Imports @Autowired for dependency injection.
import org.springframework.beans.factory.annotation.Autowired;

// PURPOSE: Imports HttpHeaders — provides constants for standard HTTP header names.
// IMPACT: Used to set the Content-Disposition header for PGN file downloads.
import org.springframework.http.HttpHeaders;

// PURPOSE: Imports MediaType — provides constants for MIME types.
// IMPACT: Used to set the response Content-Type to text/plain for PGN downloads.
import org.springframework.http.MediaType;

// PURPOSE: Imports ResponseEntity — wrapper for HTTP responses with status codes and headers.
import org.springframework.http.ResponseEntity;

// PURPOSE: Imports Spring MVC annotations for REST controller configuration.
import org.springframework.web.bind.annotation.*;

// PURPOSE: Imports List — the standard Java collection for ordered sequences.
import java.util.List;

// PURPOSE: @RestController marks this as a REST API controller (all methods return JSON by default).
@RestController

// PURPOSE: Base URL path for all match endpoints. All routes here start with /api/matches.
@RequestMapping("/api/matches")

// PURPOSE: @CrossOrigin allows any origin (*) to access these endpoints.
// IMPACT: Less restrictive than AuthController's CORS. Allows any frontend to fetch match data.
//         NOTE: origins="*" does NOT work with allowCredentials=true (browser blocks it).
// ALTERNATIVE: Use specific origins like in SecurityConfig, or remove and rely on global CORS config.
@CrossOrigin(origins = "*")
public class MatchController { // Handles match history retrieval and PGN file downloads.
                                // IMPACT: Powers the "History" tab and "Download PGN" button in the frontend.

    // PURPOSE: Injects the MatchRepository for querying match records.
    @Autowired
    private MatchRepository matchRepository;

    // PURPOSE: Injects the MatchMoveRepository for querying moves within a match.
    @Autowired
    private MatchMoveRepository matchMoveRepository;
    
    // PURPOSE: Injects the UserRepository for looking up user records by ID.
    @Autowired
    private UserRepository userRepository;

    // PURPOSE: Handles GET /api/matches/{matchId}/pgn — generates and downloads a PGN file for a specific match.
    // IMPACT: Allows players to download their games in PGN format for analysis in external tools (e.g., Lichess, Chess.com).
    //         PGN (Portable Game Notation) is the universal standard for sharing chess games.
    // ALTERNATIVE: Return PGN as a JSON string field, or generate PGN client-side from the move list.
    @GetMapping("/{matchId}/pgn")
    public ResponseEntity<byte[]> downloadPgn(@PathVariable Long matchId) {
        // PURPOSE: Looks up the match by its database ID.
        // IMPACT: Returns Optional.empty() if the match doesn't exist, triggering a 404 response.
        // ALTERNATIVE: Use @PathVariable String matchId with findByGameId() for room-code-based lookups.
        return matchRepository.findById(matchId).map(match -> {
            // PURPOSE: Retrieves all moves for this match, sorted by move number ascending.
            // IMPACT: Produces the chronological sequence of moves needed for PGN generation.
            //         Executes: SELECT * FROM match_moves WHERE match_id = ? ORDER BY move_number ASC
            // ALTERNATIVE: Use match.getMoves() via the JPA relationship (but may trigger N+1 queries if not eager-loaded).
            List<MatchMove> moves = matchMoveRepository.findByMatchOrderByMoveNumberAsc(match);
            
            // PURPOSE: Builds the PGN string using standard PGN headers and move list.
            // IMPACT: The generated file is a valid PGN that can be imported into any chess software.
            // ALTERNATIVE: Use a PGN library (e.g., chesspresso) for more robust generation with variations/comments.
            StringBuilder pgn = new StringBuilder();

            // PURPOSE: Adds the [Event] header — identifies the event where the game was played.
            // IMPACT: Displayed in chess analysis tools as the event name.
            pgn.append("[Event \"GrandMaster Match\"]\n");

            // PURPOSE: Adds the [White] header — the username of the white player, or "AI" if null.
            // IMPACT: Identifies who played white in the PGN viewer.
            // ALTERNATIVE: Include player ratings, ELO, or timestamps for richer metadata.
            pgn.append("[White \"").append(match.getWhitePlayer() != null ? match.getWhitePlayer().getUsername() : "AI").append("\"]\n");

            // PURPOSE: Adds the [Black] header — the username of the black player, or "AI" if null.
            pgn.append("[Black \"").append(match.getBlackPlayer() != null ? match.getBlackPlayer().getUsername() : "AI").append("\"]\n");

            // PURPOSE: Adds the [Result] header — the game outcome ("WHITE_WIN", "BLACK_WIN", "DRAW", or "*" for ongoing).
            // IMPACT: Chess tools use this to annotate the game result.
            // ALTERNATIVE: Map to standard PGN results: "1-0", "0-1", "1/2-1/2", "*" for proper PGN compliance.
            pgn.append("[Result \"").append(match.getResult() != null ? match.getResult() : "*").append("\"]\n\n");
            
            // PURPOSE: Iterates through all moves and formats them in PGN notation.
            // IMPACT: Produces move text like: "1. e4 e5 2. Nf3 Nc6 ..."
            for (int i = 0; i < moves.size(); i++) {
                // PURPOSE: Adds move numbers before each white move (every other move).
                // IMPACT: PGN convention: "1. e4 e5 2. Nf3 ..." — numbers only appear before white's moves.
                if (i % 2 == 0) {
                    pgn.append((i / 2) + 1).append(". ");
                }
                // PURPOSE: Appends the SAN (Standard Algebraic Notation) of each move.
                // IMPACT: SAN is the human-readable format (e.g., "e4", "Nf3", "O-O") used in all chess publications.
                pgn.append(moves.get(i).getSan()).append(" ");
            }
            
            // PURPOSE: Converts the PGN string to a byte array for file download.
            // IMPACT: HTTP response body carries the raw bytes of the PGN text file.
            byte[] bytes = pgn.toString().getBytes();

            // PURPOSE: Builds the HTTP response with appropriate headers for file download.
            // IMPACT: Browser triggers a file download dialog with the specified filename.
            return ResponseEntity.ok()
                    // PURPOSE: Sets the Content-Disposition header to "attachment" for forced download.
                    // IMPACT: Browser downloads the file instead of displaying it inline.
                    //         Filename is "match_42.pgn" (where 42 is the match ID).
                    // ALTERNATIVE: Use "inline" disposition to display in-browser.
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=match_" + matchId + ".pgn")

                    // PURPOSE: Sets the MIME type to text/plain for the PGN file.
                    // IMPACT: Operating system associates the file with text editors (or chess apps via .pgn extension).
                    // ALTERNATIVE: Use "application/x-chess-pgn" for a more specific MIME type.
                    .contentType(MediaType.TEXT_PLAIN)

                    // PURPOSE: Sets the response body to the PGN file bytes.
                    .body(bytes);

        // PURPOSE: If the match ID doesn't exist, returns HTTP 404 Not Found.
        // IMPACT: Frontend handles this gracefully (e.g., shows "Match not found" error).
        }).orElse(ResponseEntity.notFound().build());
    }

    // PURPOSE: Handles GET /api/matches/user/{userId} — retrieves all matches for a specific user.
    // IMPACT: Powers the "Match History" tab in the frontend, showing all past games for the logged-in user.
    // ALTERNATIVE: Use pagination (Pageable parameter) for users with many games (currently returns ALL matches).
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Match>> getUserMatches(@PathVariable Long userId) {
        // PURPOSE: Looks up the user by their database ID.
        // IMPACT: Returns 404 if the user doesn't exist.
        return userRepository.findById(userId).map(user -> {
            // PURPOSE: Finds all matches where this user was either white or black, ordered by newest first.
            // IMPACT: Executes: SELECT * FROM matches WHERE white_player_id = ? OR black_player_id = ? ORDER BY id DESC
            //         Returns matches regardless of whether the user played white or black.
            // ALTERNATIVE: Use @Query with JOIN FETCH to eagerly load moves and avoid N+1 query issues.
            //              Add pagination: findByWhitePlayerOrBlackPlayer(user, user, Pageable.ofSize(20))
            List<Match> matches = matchRepository.findByWhitePlayerOrBlackPlayerOrderByIdDesc(user, user);

            // PURPOSE: Returns HTTP 200 with the list of matches serialized as JSON.
            // IMPACT: Frontend receives an array of match objects for rendering in the history list.
            return ResponseEntity.ok(matches);

        // PURPOSE: Returns 404 if the user ID doesn't exist in the database.
        }).orElse(ResponseEntity.notFound().build());
    }
}
