// PURPOSE: JPA entity representing a chess puzzle for the tactical training feature.
// IMPACT: Maps to the "puzzles" table. Each row = one puzzle with a position, solution, and metadata.
//         Used by PuzzleService for daily/random puzzle selection and PuzzleController for API responses.
// ALTERNATIVE: Load puzzles from an external puzzle database API (e.g., Lichess puzzle API).
package com.chess.model;

// PURPOSE: Imports all JPA annotations.
import jakarta.persistence.*;

// PURPOSE: Lombok @Data generates getters, setters, toString, equals, hashCode.
import lombok.Data;

// PURPOSE: Lombok @NoArgsConstructor — required by JPA/Hibernate.
import lombok.NoArgsConstructor;

// PURPOSE: Lombok @AllArgsConstructor — used in PuzzleService for seeding:
//         new Puzzle(null, fen, solution, description, difficulty)
import lombok.AllArgsConstructor;

// PURPOSE: @Data generates all boilerplate methods.
@Data

// PURPOSE: @Entity marks this as a JPA entity managed by Hibernate.
@Entity

// PURPOSE: Maps to the "puzzles" table in PostgreSQL.
@Table(name = "puzzles")

// PURPOSE: Required by JPA — generates public Puzzle() {}.
@NoArgsConstructor

// PURPOSE: Used in PuzzleService to create puzzles with all fields set in one constructor call.
@AllArgsConstructor
public class Puzzle { // Represents a chess tactical puzzle.
                      // IMPACT: Core entity for the "Training" feature in the frontend.

    // PURPOSE: Auto-incremented primary key.
    // IMPACT: Used by puzzleRepository.findById(id) to fetch specific puzzles.
    //         Puzzle IDs are used as seeds for the "daily puzzle" selection (day_of_year % count + 1).
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // PURPOSE: The FEN string representing the starting position of the puzzle.
    // IMPACT: Loaded into the chess.js instance on the frontend to set up the board.
    //         FEN encodes: piece positions, whose turn it is, castling rights, en passant, move clocks.
    //         nullable=false ensures every puzzle has a valid starting position.
    // ALTERNATIVE: Use a PGN string with setup headers for puzzles that need move context.
    @Column(nullable = false)
    private String fen; // Starting position

    // PURPOSE: Comma-separated string of correct moves in UCI notation (e.g., "e2e4,e7e5" or "b3b8,d7b8,d1d8").
    // IMPACT: The frontend validates player moves against this solution sequence step by step.
    //         Multi-move puzzles require alternating player/AI moves.
    //         nullable=false ensures every puzzle has a solution.
    // ALTERNATIVE: Store as a JSON array ["e2e4", "e7e5"] for easier parsing.
    //              Or use SAN notation for human readability.
    @Column(nullable = false)
    private String solution; // Comma-separated correct moves (e.g. "e2e4,e7e5")

    // PURPOSE: A human-readable description of the puzzle objective (e.g., "Mate in 1", "Fork the King and Rook").
    // IMPACT: Displayed in the frontend puzzle UI header to tell the player what to look for.
    //         nullable=false ensures every puzzle has a description.
    // ALTERNATIVE: Add a more detailed "explanation" field shown after solving.
    @Column(nullable = false)
    private String description; // e.g. "Mate in 1"

    // PURPOSE: The difficulty level of the puzzle ("Easy", "Medium", "Hard").
    // IMPACT: Displayed as a colored badge in the frontend (green=Easy, red=Hard).
    //         Could be used for filtering puzzles by difficulty.
    //         nullable=false ensures every puzzle has a difficulty rating.
    // ALTERNATIVE: Use a numeric rating (e.g., ELO-based difficulty from 800-2800) for finer granularity.
    //              Or use an enum: public enum Difficulty { EASY, MEDIUM, HARD }
    @Column(nullable = false)
    private String difficulty; // Easy, Medium, Hard
}
