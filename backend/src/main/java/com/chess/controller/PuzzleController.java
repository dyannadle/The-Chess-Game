// PURPOSE: REST controller for the puzzle/tactical training feature.
// IMPACT: Provides /api/puzzles/daily and /api/puzzles/random endpoints for the Training tab.
//         Without this, the "Tactical Training" feature cannot serve puzzles to the frontend.
// ALTERNATIVE: Load puzzles client-side from a static JSON file (no server needed, but less flexible).
package com.chess.controller;

// PURPOSE: Imports the Puzzle JPA entity — represents a chess puzzle (FEN, solution, description, difficulty).
import com.chess.model.Puzzle;

// PURPOSE: Imports PuzzleService — business logic for fetching daily and random puzzles.
import com.chess.service.PuzzleService;

// PURPOSE: Imports @Autowired for dependency injection.
import org.springframework.beans.factory.annotation.Autowired;

// PURPOSE: Imports ResponseEntity for HTTP response handling with status codes.
import org.springframework.http.ResponseEntity;

// PURPOSE: Imports Spring MVC REST annotations.
import org.springframework.web.bind.annotation.*;

// PURPOSE: @RestController marks this as a JSON-returning REST controller.
@RestController

// PURPOSE: Base path for all puzzle endpoints. All routes start with /api/puzzles.
@RequestMapping("/api/puzzles")

// PURPOSE: Allows any origin to access puzzle endpoints (training data is not sensitive).
// ALTERNATIVE: Restrict to specific origins via SecurityConfig's global CORS.
@CrossOrigin(origins = "*")
public class PuzzleController { // Serves chess puzzles for the tactical training feature.
                                 // IMPACT: Powers the "Training" tab in the frontend UI.

    // PURPOSE: Injects the PuzzleService bean for puzzle business logic.
    @Autowired
    private PuzzleService puzzleService;

    // PURPOSE: Handles GET /api/puzzles/daily — returns the "daily puzzle" (deterministic based on date).
    // IMPACT: Every user sees the same puzzle on the same day (community challenge feel).
    // ALTERNATIVE: Return a random puzzle each time (less community engagement, more variety).
    @GetMapping("/daily")
    public ResponseEntity<Puzzle> getDailyPuzzle() {
        // PURPOSE: Delegates to PuzzleService.getDailyPuzzle() which uses day-of-year as a seed.
        // IMPACT: Returns Optional<Puzzle> — either a puzzle or empty if the database is empty.
        //         .map(ResponseEntity::ok) wraps the puzzle in HTTP 200.
        //         .orElse(ResponseEntity.notFound().build()) returns HTTP 404 if no puzzles exist.
        // ALTERNATIVE: Return a default fallback puzzle instead of 404 when the DB is empty.
        return puzzleService.getDailyPuzzle()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // PURPOSE: Handles GET /api/puzzles/random — returns a random puzzle from the database.
    // IMPACT: Used for the "Next Puzzle" button after solving a puzzle.
    // ALTERNATIVE: Return puzzles the user hasn't solved yet (requires tracking per-user puzzle progress).
    @GetMapping("/random")
    public ResponseEntity<Puzzle> getRandomPuzzle() {
        // PURPOSE: Delegates to PuzzleService.getRandomPuzzle() which uses Random for selection.
        // IMPACT: Returns a randomly selected puzzle or 404 if none exist.
        // ALTERNATIVE: Use @Query("SELECT p FROM Puzzle p ORDER BY RANDOM() LIMIT 1") for database-level random.
        return puzzleService.getRandomPuzzle()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
