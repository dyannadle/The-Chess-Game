// PURPOSE: Service class that manages chess puzzles — seeding the database and providing daily/random puzzles.
// IMPACT: Populates the "puzzles" table on first startup and serves puzzles to the PuzzleController.
//         Without this, the "Tactical Training" feature would have no puzzles to show.
// ALTERNATIVE: Load puzzles from an external API (Lichess puzzle DB), or from a static JSON file on the classpath.
package com.chess.service;

// PURPOSE: Imports the Puzzle JPA entity.
import com.chess.model.Puzzle;

// PURPOSE: Imports PuzzleRepository for database access.
import com.chess.repository.PuzzleRepository;

// PURPOSE: Imports @PostConstruct — marks a method to run ONCE after the bean is fully initialized.
// IMPACT: seedPuzzles() runs automatically on server startup, populating the puzzles table if empty.
// ALTERNATIVE: Use ApplicationRunner or CommandLineRunner for startup tasks (more flexible, can access CLI args).
//              Or use data.sql / import.sql files for SQL-based seeding.
import jakarta.annotation.PostConstruct;

// PURPOSE: Imports @Autowired for dependency injection.
import org.springframework.beans.factory.annotation.Autowired;

// PURPOSE: Imports @Service — marks this class as a Spring-managed service bean.
import org.springframework.stereotype.Service;

// PURPOSE: Imports List for the getAllPuzzles() method.
import java.util.List;

// PURPOSE: Imports Optional for nullable query results.
import java.util.Optional;

// PURPOSE: Imports Random for the getRandomPuzzle() method.
import java.util.Random;

// PURPOSE: @Service registers this class as a business logic bean in Spring's IoC container.
@Service
public class PuzzleService { // Business logic for the puzzle/training feature.
                              // IMPACT: Seeds puzzles on startup and provides puzzle selection logic.

    // PURPOSE: Injects the PuzzleRepository for database operations.
    @Autowired
    private PuzzleRepository puzzleRepository;

    // PURPOSE: @PostConstruct method — runs automatically after Spring finishes constructing this bean.
    // IMPACT: Seeds the puzzles table with 95 puzzles (5 manual + 90 variations) if the table is empty.
    //         Only runs on first deployment or after a database wipe — idempotent via the count() check.
    //         Runs on EVERY server start, but only inserts if count == 0.
    // ALTERNATIVE: Use Spring Boot's data.sql file for SQL-based seeding.
    //              Use Flyway or Liquibase for versioned database migrations (production-grade).
    @PostConstruct
    public void seedPuzzles() {
        // PURPOSE: Checks if the puzzles table is empty before seeding.
        // IMPACT: Prevents duplicate seeding on subsequent restarts.
        //         puzzleRepository.count() executes: SELECT COUNT(*) FROM puzzles
        if (puzzleRepository.count() == 0) {
            // PURPOSE: Seeds 5 unique, hand-crafted puzzles with varied positions and difficulties.
            manualSeed();
            // PURPOSE: Seeds 90 additional puzzle variations (currently all the same position — placeholder).
            // IMPACT: Provides a large enough pool for daily/random selection, but lacks variety.
            generateVariations(90);
        }
    }

    // PURPOSE: Seeds 5 hand-crafted puzzles with real chess positions, solutions, and difficulty ratings.
    // IMPACT: These are the "quality" puzzles with diverse tactical themes.
    //         Each Puzzle is created with: Puzzle(null, fen, solution, description, difficulty)
    //         null for ID means the database auto-generates the primary key.
    // ALTERNATIVE: Load puzzles from a JSON resource file: src/main/resources/puzzles.json
    private void manualSeed() {
        // PURPOSE: Puzzle 1 — Scholar's Mate defense. Player must find Qf6 to block the threat.
        // IMPACT: An "Easy" puzzle teaching beginners about common opening traps.
        puzzleRepository.save(new Puzzle(null, "r1bqkbnr/pppp1ppp/2n5/4p1B1/4P3/5Q2/PPPP1PPP/RN2KBNR b KQkq - 0 1", "d8f6", "Respond to the Scholar's Mate threat", "Easy"));

        // PURPOSE: Puzzle 2 — Advanced back rank mate combination requiring 3 accurate moves.
        // IMPACT: A "Hard" puzzle testing multi-move calculation and back rank awareness.
        puzzleRepository.save(new Puzzle(null, "4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 1", "b3b8,d7b8,d1d8", "Advanced Back Rank Mate", "Hard"));

        // PURPOSE: Puzzle 3 — Ladder mate combination with rook sacrifice.
        // IMPACT: A "Medium" difficulty puzzle testing intermediate tactical skills.
        puzzleRepository.save(new Puzzle(null, "2r3k1/1p3p1p/p5p1/5q2/8/P1BR4/1P3PPP/3R2K1 w - - 0 1", "d3d8,c8d8,d1d8", "Ladder Mate Combination", "Medium"));

        // PURPOSE: Puzzle 4 — Simple center solidification with d6.
        // IMPACT: An "Easy" puzzle teaching positional play in the Italian Game.
        puzzleRepository.save(new Puzzle(null, "r1bq1rk1/pppp1ppp/2n2n2/4p3/2B1P3/2P2N2/PPP2PPP/R1BQR1K1 b - - 0 1", "d7d6", "Solidify the center", "Easy"));

        // PURPOSE: Puzzle 5 — King activity in a pawn endgame.
        // IMPACT: An "Easy" puzzle teaching the importance of king centralization in endgames.
        puzzleRepository.save(new Puzzle(null, "6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1", "g1f1", "King activity in endgame", "Easy"));
    }

    // PURPOSE: Generates 'count' puzzle variations. Currently all the same position (Mate in 1).
    // IMPACT: Pads the puzzle database to 95 total puzzles for rotation variety.
    //         WARNING: All 90 variations are IDENTICAL — this is a placeholder for future unique puzzles.
    //         The daily puzzle uses (dayOfYear % count + 1) so more puzzles = more rotation.
    // ALTERNATIVE: Generate truly unique puzzles from a database of FEN positions.
    //              Import from Lichess's puzzle database (millions of real puzzles).
    private void generateVariations(int count) {
        for (int i = 0; i < count; i++) {
            // PURPOSE: Creates a "Mate in 1" puzzle — Queen to e7 checkmates the king.
            // IMPACT: Simple but repetitive. All 90 variations are the same puzzle with the same solution.
            // ALTERNATIVE: Randomize positions (e.g., different queen/king placements) for variety.
            puzzleRepository.save(new Puzzle(null, 
                "4k3/Q7/4K3/8/8/8/8/8 w - - 0 1",  // FEN: White Queen on a7, White King on e6, Black King on e8.
                "a7e7",                                // Solution: Queen from a7 to e7 = checkmate.
                "Find the checkmate (Mate in 1)",      // Description shown in the UI.
                "Easy"));                              // Difficulty badge color: green.
        }
    }

    // PURPOSE: Returns all puzzles from the database (currently unused by any controller endpoint).
    // IMPACT: Could be used for an admin panel or a "browse all puzzles" feature.
    // ALTERNATIVE: Add pagination: puzzleRepository.findAll(Pageable.ofSize(20))
    public List<Puzzle> getAllPuzzles() {
        // PURPOSE: Executes: SELECT * FROM puzzles — returns all rows.
        return puzzleRepository.findAll();
    }

    // PURPOSE: Returns the "daily puzzle" — deterministic based on the current date.
    // IMPACT: Every user who calls this on the same day gets the SAME puzzle (community challenge feel).
    //         Uses day-of-year as a seed to deterministically select a puzzle ID.
    // ALTERNATIVE: Cache the daily puzzle in a field and refresh it daily with @Scheduled.
    public Optional<Puzzle> getDailyPuzzle() {
        // PURPOSE: Gets the total number of puzzles in the database.
        long count = puzzleRepository.count();

        // PURPOSE: Returns empty if no puzzles exist (database is empty or seeding failed).
        if (count == 0) return Optional.empty();
        
        // PURPOSE: Uses the current day-of-year (1-365) as a deterministic seed.
        // IMPACT: Day 100 always returns the same puzzle. Resets annually (day 1 and 366 are the same).
        // ALTERNATIVE: Use LocalDate.now().hashCode() for more even distribution.
        //              Or use the date as a hash seed for better randomization.
        long dayOfYear = java.time.LocalDate.now().getDayOfYear();

        // PURPOSE: Calculates the puzzle ID using modular arithmetic.
        // IMPACT: (dayOfYear % count) gives 0 to count-1, then +1 maps to IDs 1 to count.
        //         ASSUMPTION: Puzzle IDs are sequential starting from 1. If puzzles are deleted, this may return empty.
        // ALTERNATIVE: Use puzzleRepository.findAll() and index into the list (no ID assumption).
        long id = (dayOfYear % count) + 1;

        // PURPOSE: Fetches the puzzle by its calculated ID.
        // IMPACT: Returns Optional<Puzzle> — may be empty if the ID doesn't exist (deleted puzzle).
        return puzzleRepository.findById(id);
    }
    
    // PURPOSE: Returns a randomly selected puzzle from the database.
    // IMPACT: Used by the "Next Puzzle" button in the PuzzleBoard component.
    //         Each call returns a potentially different puzzle.
    // ALTERNATIVE: Use @Query("SELECT p FROM Puzzle p ORDER BY RANDOM() LIMIT 1") for database-level random.
    //              Track which puzzles the user has solved to avoid repeats.
    public Optional<Puzzle> getRandomPuzzle() {
        // PURPOSE: Gets the total puzzle count.
        long count = puzzleRepository.count();

        // PURPOSE: Returns empty if no puzzles exist.
        if (count == 0) return Optional.empty();
        
        // PURPOSE: Generates a random puzzle ID between 1 and count (inclusive).
        // IMPACT: new Random().nextLong(count) returns 0 to count-1, then +1 maps to 1 to count.
        //         ASSUMPTION: Same as getDailyPuzzle — assumes sequential IDs starting from 1.
        //         WARNING: Creates a new Random() instance each call — not ideal for performance.
        // ALTERNATIVE: Use a shared Random field or ThreadLocalRandom.current().nextLong(count) + 1.
        long id = new Random().nextLong(count) + 1;

        // PURPOSE: Fetches the randomly selected puzzle by ID.
        return puzzleRepository.findById(id);
    }
}
