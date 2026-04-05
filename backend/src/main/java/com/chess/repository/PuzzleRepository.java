// PURPOSE: Spring Data JPA repository for the Puzzle entity.
// IMPACT: Provides database access for chess puzzles — used by PuzzleService for seeding, counting, and fetching.
// ALTERNATIVE: Use a static JSON file or external puzzle API instead of a database.
package com.chess.repository;

// PURPOSE: Imports the Puzzle entity that this repository manages.
import com.chess.model.Puzzle;

// PURPOSE: Imports JpaRepository for auto-generated CRUD operations.
import org.springframework.data.jpa.repository.JpaRepository;

// PURPOSE: Imports @Repository — explicitly marks this as a Spring repository component.
// IMPACT: Optional for JpaRepository extensions (auto-detected), but makes the intent clear.
//         Also enables Spring's DataAccessException translation for consistent error handling.
// ALTERNATIVE: Remove @Repository — Spring Data JPA auto-detects JpaRepository interfaces.
import org.springframework.stereotype.Repository;

// PURPOSE: Imports Optional for nullable query results.
import java.util.Optional;

// PURPOSE: @Repository marks this interface as a data access component.
// IMPACT: Enables exception translation (DB exceptions → Spring's DataAccessException hierarchy).
//         Redundant for JpaRepository extensions but is a documentation convention.
@Repository
public interface PuzzleRepository extends JpaRepository<Puzzle, Long> {

    // PURPOSE: Finds a puzzle by its database ID.
    // IMPACT: Spring generates: SELECT * FROM puzzles WHERE id = ?
    //         Used by PuzzleService.getDailyPuzzle() and getRandomPuzzle() to fetch specific puzzles.
    //         NOTE: This method is REDUNDANT — JpaRepository already provides findById(Long id).
    //         The explicit declaration adds no functionality over the inherited version.
    // ALTERNATIVE: Remove this method entirely and use the inherited findById() from JpaRepository.
    Optional<Puzzle> findById(Long id);
}
