// PURPOSE: JPA entity representing a single chess move within a match.
// IMPACT: Maps to the "match_moves" table. Each row = one move (e.g., e2→e4) linked to a specific match.
//         Used for match replay, move history display, and PGN generation.
// ALTERNATIVE: Store moves as a JSON array column in the Match entity (simpler but harder to query).
package com.chess.model;

// PURPOSE: Imports all JPA annotations.
import jakarta.persistence.*;

// PURPOSE: Lombok annotations for constructor/boilerplate generation.
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// PURPOSE: Imports LocalDateTime for the move timestamp.
import java.time.LocalDateTime;

// PURPOSE: @Entity marks this as a JPA entity mapped to a database table.
@Entity

// PURPOSE: Maps to the "match_moves" table in PostgreSQL.
@Table(name = "match_moves")

// PURPOSE: Lombok annotations — generate getters, setters, constructors, toString, etc.
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MatchMove { // Represents a single chess move within a game.
                          // IMPACT: Enables move-by-move replay and PGN export.

    // PURPOSE: Auto-incremented primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // PURPOSE: @ManyToOne creates the foreign key relationship to the parent Match.
    // IMPACT: Creates a "match_id" column in match_moves → references matches(id).
    //         FetchType.LAZY means the parent Match is NOT loaded unless explicitly accessed (performance).
    //         @JoinColumn specifies the exact column name for the foreign key.
    // ALTERNATIVE: FetchType.EAGER (loads match with every move query — rarely needed).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id") // Explicit FK column name. Default would be "match_id" anyway, but explicit is clearer.
    private Match match;

    // PURPOSE: The starting square of the move (e.g., "e2", "g1").
    // IMPACT: Used in move history display and reconstruction of the game.
    // ALTERNATIVE: Store only SAN (Standard Algebraic Notation) which encodes from/to implicitly.
    private String fromSquare;

    // PURPOSE: The destination square of the move (e.g., "e4", "f3").
    // IMPACT: Combined with fromSquare, fully defines the move on the board.
    private String toSquare;

    // PURPOSE: Standard Algebraic Notation of the move (e.g., "e4", "Nf3", "O-O", "Qxd5+").
    // IMPACT: The primary notation used in PGN generation and move history display.
    //         SAN is the human-readable chess notation used in all publications.
    // ALTERNATIVE: UCI notation (e.g., "e2e4") which is machine-friendly but less readable.
    private String san; // Standard Algebraic Notation (e.g., "e4", "Nf3")

    // PURPOSE: The piece type that moved, as a lowercase letter (e.g., "p" for pawn, "n" for knight).
    // IMPACT: Used for rich move history display (shows piece icons/names next to moves).
    // ALTERNATIVE: Could derive from SAN or FEN instead of storing separately (avoids data duplication).
    private String piece; // Piece name

    // PURPOSE: The color of the piece that moved ("w" for white, "b" for black).
    // IMPACT: Used to determine if the move was white's or black's in the move history.
    private String color; // "w" or "b"

    // PURPOSE: The type of piece captured by this move, if any (e.g., "p", "n", "q"). Null if no capture.
    // IMPACT: Could be used to display captured pieces or calculate material advantage.
    // ALTERNATIVE: Derive from comparing FEN positions before/after the move.
    private String captured; // Name of captured piece, if any

    // PURPOSE: The sequential move number within the match (1, 2, 3, ...).
    // IMPACT: Used for ordering moves chronologically in replays and PGN generation.
    //         This is the move INDEX (all moves), not the chess move number (which resets per pair).
    // ALTERNATIVE: Use the auto-generated ID for ordering (but IDs might not be sequential under concurrent writes).
    private int moveNumber;

    // PURPOSE: Timestamp of when this move was made. Defaults to the current time.
    // IMPACT: Could be used for time analysis (how long each move took).
    // ALTERNATIVE: Use @CreatedDate with Spring Data Auditing.
    private LocalDateTime timestamp = LocalDateTime.now();
}
