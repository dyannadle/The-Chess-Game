// PURPOSE: JPA entity representing a user account in the chess platform.
// IMPACT: Maps to the "users" table in PostgreSQL. Stores login credentials and game statistics.
//         This is the core identity model — referenced by Match (as white/black player) and AuthController.
// ALTERNATIVE: Use Spring Security's UserDetails implementation for tighter security integration.
package com.chess.model; // Part of the model/entity layer — defines the database schema.

// PURPOSE: Imports all JPA annotations (wildcard import for brevity).
// IMPACT: Provides @Entity, @Table, @Id, @GeneratedValue, @Column annotations used below.
// ALTERNATIVE: Import each annotation individually for clarity (e.g., import jakarta.persistence.Entity).
import jakarta.persistence.*;

// PURPOSE: Lombok's @AllArgsConstructor — auto-generates a constructor with ALL fields as parameters.
// IMPACT: Allows: new User(id, username, password, wins, losses, draws, xp) — useful for testing.
// ALTERNATIVE: Write the constructor manually, or use @Builder for a builder pattern.
import lombok.AllArgsConstructor;

// PURPOSE: Lombok's @Data — auto-generates getters, setters, toString(), equals(), and hashCode().
// IMPACT: Eliminates ~100 lines of boilerplate code. Every field gets a getter/setter automatically.
//         WARNING: @Data on JPA entities can cause issues with lazy-loaded collections in equals()/hashCode().
// ALTERNATIVE: Use @Getter @Setter @ToString separately, or write methods manually.
//              For JPA entities, @Getter @Setter is safer than @Data.
import lombok.Data;

// PURPOSE: Lombok's @NoArgsConstructor — auto-generates a no-argument constructor.
// IMPACT: REQUIRED by JPA/Hibernate — the persistence provider needs a no-arg constructor to instantiate entities.
// ALTERNATIVE: Write the constructor manually: public User() {}
import lombok.NoArgsConstructor;

// PURPOSE: @Entity marks this class as a JPA entity — it will be managed by Hibernate and mapped to a database table.
// IMPACT: Hibernate creates/updates the "users" table based on this class's fields.
//         Spring Data JPA can now use UserRepository to query User objects via JPQL or derived methods.
// ALTERNATIVE: Use @Document for MongoDB, or @Table (MyBatis/JDBC) for non-JPA persistence.
@Entity

// PURPOSE: @Table specifies the database table name. Without it, Hibernate uses the class name ("User").
// IMPACT: Maps this entity to the "users" table. "user" is a reserved word in PostgreSQL, so "users" avoids conflicts.
// ALTERNATIVE: @Table(name = "app_users") or @Table(name = "chess_users") — any valid table name works.
@Table(name = "users")

// PURPOSE: @Data generates all boilerplate (getters, setters, toString, equals, hashCode).
// IMPACT: Reduces file length significantly. AuthController calls user.getUsername(), user.getWins(), etc.
@Data

// PURPOSE: @AllArgsConstructor generates User(Long id, String username, String password, int wins, int losses, int draws, int xp).
@AllArgsConstructor

// PURPOSE: @NoArgsConstructor generates User() — required by JPA.
@NoArgsConstructor
public class User { // The user entity. Each instance = one row in the "users" table.

    // PURPOSE: Primary key field. Auto-incremented by the database.
    // IMPACT: Each user gets a unique Long ID (1, 2, 3, ...) used for relationships and lookups.
    // ALTERNATIVE: Use UUID (@GeneratedValue(generator = "UUID")) for distributed systems (no sequential guessing).
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Uses database auto-increment (SERIAL in PostgreSQL).
                                                         // ALTERNATIVE: GenerationType.SEQUENCE for explicit DB sequences.
                                                         //              GenerationType.UUID for random UUIDs.
    private Long id;

    // PURPOSE: The user's unique username, used for login and display.
    // IMPACT: unique=true creates a UNIQUE constraint on the column — prevents duplicate usernames at the DB level.
    //         nullable=false creates a NOT NULL constraint — username is required.
    //         Type defaults to VARCHAR(255) — can specify @Column(length = 50) to limit.
    // ALTERNATIVE: Add @Column(length = 50) to limit username length. Add @Pattern for format validation.
    @Column(unique = true, nullable = false)
    private String username;

    // PURPOSE: The user's BCrypt-hashed password.
    // IMPACT: nullable=false ensures every user has a password. Stored as a ~60-char BCrypt hash string.
    //         NEVER contains the plaintext password — only the hash.
    //         WARNING: This field is included in @Data's toString() — could leak hashes in logs.
    // ALTERNATIVE: Add @ToString.Exclude to prevent password from appearing in logs.
    //              Add @JsonIgnore to prevent serialization to JSON (currently AuthResponse avoids this).
    @Column(nullable = false)
    private String password;

    // PURPOSE: Tracks the number of games the user has won.
    // IMPACT: Displayed in the frontend dashboard and AuthResponse. Defaults to 0 for new users.
    // ALTERNATIVE: Calculate dynamically from Match records instead of storing as a denormalized counter.
    private int wins = 0;

    // PURPOSE: Tracks the number of games the user has lost.
    // IMPACT: Displayed in the frontend. Part of the user's performance statistics.
    private int losses = 0;

    // PURPOSE: Tracks the number of drawn games.
    // IMPACT: Currently not displayed in AuthResponse (not sent to frontend), but stored for future use.
    // ALTERNATIVE: Remove if not needed, or add to AuthResponse for display.
    private int draws = 0;

    // PURPOSE: Experience points — a gamification metric for player progression.
    // IMPACT: Displayed in the frontend. Could be used for ranking, matchmaking, or unlocking features.
    //         Currently not incremented anywhere in the codebase (placeholder for future feature).
    // ALTERNATIVE: Calculate from wins/losses/draws instead of storing separately.
    private int xp = 0;
}
