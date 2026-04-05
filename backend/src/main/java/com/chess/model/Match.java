// PURPOSE: JPA entity representing a chess match/game session.
// IMPACT: Maps to the "matches" table in PostgreSQL. Each row = one chess game between two players.
//         Referenced by MatchMove (one match has many moves) and MatchController (for history/PGN).
// ALTERNATIVE: Use a NoSQL document (MongoDB) for flexible match data with embedded moves.
package com.chess.model;

// PURPOSE: Imports all JPA annotations.
import jakarta.persistence.*;

// PURPOSE: Lombok's @AllArgsConstructor — generates constructor with all fields.
import lombok.AllArgsConstructor;

// PURPOSE: Lombok's @Data — generates getters, setters, toString, equals, hashCode.
// IMPACT: WARNING: @Data with @OneToMany can cause StackOverflow in toString() if bidirectional relationships exist.
//         The moves list's toString() calls Match.toString() which calls moves.toString() → infinite loop.
// ALTERNATIVE: Use @Getter @Setter @ToString(exclude = "moves") for safety.
import lombok.Data;

// PURPOSE: Lombok's @NoArgsConstructor — required by JPA/Hibernate.
import lombok.NoArgsConstructor;

// PURPOSE: Imports LocalDateTime for timestamp fields (startTime, endTime).
// IMPACT: Stored as TIMESTAMP in PostgreSQL. Used to track when games were played.
// ALTERNATIVE: Use Instant (UTC-based) for timezone-independent timestamps (better for distributed systems).
import java.time.LocalDateTime;

// PURPOSE: Imports ArrayList and List for the moves collection.
import java.util.ArrayList;
import java.util.List;

// PURPOSE: @Entity marks this class as a JPA entity managed by Hibernate.
@Entity

// PURPOSE: Maps this entity to the "matches" table. "match" is a SQL reserved word, so "matches" avoids conflicts.
@Table(name = "matches")

// PURPOSE: Lombok annotations for boilerplate reduction.
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Match { // Represents a single chess game session.
                     // IMPACT: Core entity that ties together two players and their moves.

    // PURPOSE: Auto-incremented primary key for this match.
    // IMPACT: Used as the unique identifier in URLs like /api/matches/{matchId}/pgn.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Database auto-increment (SERIAL in PostgreSQL).
    private Long id;

    // PURPOSE: The unique room/session identifier (e.g., "chess-room-1", "match-4521").
    // IMPACT: Used to link WebSocket messages to database matches. Multiple moves share the same gameId.
    //         This is the "room code" that players share to join the same game.
    // ALTERNATIVE: Use the auto-generated 'id' field as the game identifier (less human-friendly).
    private String gameId; // The unique room/session ID

    // PURPOSE: @ManyToOne creates a foreign key relationship to the User entity (white player).
    // IMPACT: Creates a "white_player_id" column in the matches table → references users(id).
    //         Hibernate automatically joins the users table when loading this field.
    //         Can be null if the game is against AI or if no player has been assigned yet.
    // ALTERNATIVE: Store just the username (String) instead of a relationship (simpler but no referential integrity).
    @ManyToOne
    private User whitePlayer;

    // PURPOSE: @ManyToOne for the black player — same as whitePlayer but for the other side.
    // IMPACT: Creates a "black_player_id" column → references users(id).
    @ManyToOne
    private User blackPlayer;

    // PURPOSE: The game result as a string.
    // IMPACT: Possible values: "WHITE_WIN", "BLACK_WIN", "DRAW", "IN_PROGRESS", or null.
    //         Updated by GameHistoryService.updateResult() when the game ends.
    //         Displayed in the match history UI and PGN headers.
    // ALTERNATIVE: Use an enum (GameResult) for type safety instead of a free-form String.
    private String result; // "WHITE_WIN", "BLACK_WIN", "DRAW", "IN_PROGRESS"

    // PURPOSE: Timestamp of when the match was created. Defaults to the current time.
    // IMPACT: Displayed in the match history ("March 29, 2026"). Cannot be null.
    // ALTERNATIVE: Use @CreatedDate with Spring Data Auditing for automatic management.
    private LocalDateTime startTime = LocalDateTime.now();

    // PURPOSE: Timestamp of when the match ended. Null while the match is in progress.
    // IMPACT: Could be used to calculate match duration. Currently not set anywhere in the codebase.
    // ALTERNATIVE: Set this in GameHistoryService.updateResult() when the result is updated.
    private LocalDateTime endTime;

    // PURPOSE: @OneToMany defines the one-to-many relationship: one Match has many MatchMoves.
    // IMPACT: mappedBy="match" means MatchMove owns the relationship (has the foreign key).
    //         CascadeType.ALL means CRUD operations on Match cascade to its moves (delete match → delete moves).
    //         FetchType.LAZY means moves are NOT loaded until explicitly accessed (performance optimization).
    //         WARNING: Lazy loading can cause LazyInitializationException outside a transaction.
    // ALTERNATIVE: FetchType.EAGER — loads all moves with every match query (simpler but slower for lists).
    //              Use @BatchSize(size=50) to optimize lazy loading with batch fetching.
    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MatchMove> moves = new ArrayList<>(); // Initializes to empty list to avoid NullPointerException.
}
