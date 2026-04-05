// PURPOSE: DTO (Data Transfer Object) for chess move messages sent over WebSocket (STOMP).
// IMPACT: Carries all data about a chess move between the frontend and backend via WebSocket.
//         Used in ChessController.processMove() and GameHistoryService.saveMove().
//         Also broadcasted to all players in the game room via @SendTo.
// ALTERNATIVE: Use a lighter DTO with only from/to/san/fen for bandwidth efficiency.
package com.chess.model;

// PURPOSE: Lombok annotations for boilerplate reduction.
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// PURPOSE: @Data generates getters/setters for all fields — used by Jackson for JSON serialization/deserialization.
@Data

// PURPOSE: Constructor with all fields for convenience.
@AllArgsConstructor

// PURPOSE: No-arg constructor required by Jackson for JSON → Object conversion.
@NoArgsConstructor
public class MoveRequest { // The WebSocket message payload for chess moves.
                           // IMPACT: Flows through: Frontend → STOMP → ChessController → GameHistoryService → DB.

    // PURPOSE: The starting square of the move (e.g., "e2").
    // IMPACT: Part of the move definition. Used to reconstruct the move on the opponent's board.
    private String from;

    // PURPOSE: The destination square of the move (e.g., "e4").
    // IMPACT: Combined with 'from', defines the move. Broadcast to all players for board sync.
    private String to;

    // PURPOSE: Pawn promotion piece type (e.g., "q" for queen, "r" for rook, "b" for bishop, "n" for knight).
    // IMPACT: Only relevant for pawn promotion moves. Null/empty for normal moves.
    // ALTERNATIVE: Default to "q" (queen) client-side if not specified — most promotions are to queen.
    private String promotion; // Optional: q, r, b, n

    // PURPOSE: The FEN (Forsyth-Edwards Notation) string representing the board state AFTER this move.
    // IMPACT: Used for board synchronization — the opponent can directly load this FEN instead of replaying all moves.
    //         FEN encodes: piece positions, active color, castling rights, en passant, half/full move clocks.
    // ALTERNATIVE: Don't send FEN — derive it client-side by replaying all moves (uses less bandwidth).
    private String fen;      // Current board state after move

    // PURPOSE: Standard Algebraic Notation of the move (e.g., "e4", "Nf3", "O-O-O", "Qxd5#").
    // IMPACT: Used for display in the move history panel and for PGN export.
    //         SAN is the universal human-readable chess move notation.
    // ALTERNATIVE: UCI notation ("e2e4") for machine processing.
    private String san;      // Standard Algebraic Notation

    // PURPOSE: Room/session identifier linking this move to a specific game.
    // IMPACT: Used by GameHistoryService to find or create the corresponding Match record.
    private String gameId;   // Unique ID for the session

    // PURPOSE: The piece type that moved (e.g., "p" for pawn, "n" for knight, "k" for king).
    // IMPACT: Stored in MatchMove for rich move history display.
    private String piece;    // Piece name (e.g., "p", "n")

    // PURPOSE: The color of the moving piece ("w" for white, "b" for black).
    // IMPACT: Used to determine which player made the move and assign player roles in the match.
    private String color;    // "w" or "b"

    // PURPOSE: The type of piece captured by this move, if any. Null if no capture.
    // IMPACT: Stored in MatchMove for capture tracking and material analysis.
    private String captured; // Captured piece name

    // PURPOSE: The database ID of the user who made this move.
    // IMPACT: Used by GameHistoryService to link the move's player to the Match (set white/black player).
    //         Can be null for anonymous or AI moves.
    // ALTERNATIVE: Use username instead of numeric ID for human readability.
    private Long userId;     // User ID for history

    // PURPOSE: White player's remaining time in seconds at the moment of this move.
    // IMPACT: Synced to the opponent's board so both players see the same timers.
    //         Used for time-control enforcement.
    // ALTERNATIVE: Track time server-side for authoritative timekeeping (currently client-side only).
    private Integer whiteTime; // White's remaining time in seconds

    // PURPOSE: Black player's remaining time in seconds at the moment of this move.
    // IMPACT: Same as whiteTime but for the black player.
    private Integer blackTime; // Black's remaining time in seconds

    // PURPOSE: Flag indicating whether the match clock is currently running.
    // IMPACT: Synced between players — when one player starts the clock, the other sees it running too.
    // ALTERNATIVE: Derive from move history (game is active after the first move).
    private Boolean gameActive; // Is the match clock running?
}
