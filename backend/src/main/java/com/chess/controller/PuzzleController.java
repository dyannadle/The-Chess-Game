package com.chess.controller;

import com.chess.model.Puzzle;
import com.chess.service.PuzzleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/puzzles")
@CrossOrigin(origins = "*")
public class PuzzleController {

    @Autowired
    private PuzzleService puzzleService;

    @GetMapping("/daily")
    public ResponseEntity<Puzzle> getDailyPuzzle() {
        return puzzleService.getDailyPuzzle()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/random")
    public ResponseEntity<Puzzle> getRandomPuzzle() {
        return puzzleService.getRandomPuzzle()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
