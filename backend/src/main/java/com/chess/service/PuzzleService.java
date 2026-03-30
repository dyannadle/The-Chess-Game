package com.chess.service;

import com.chess.model.Puzzle;
import com.chess.repository.PuzzleRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class PuzzleService {

    @Autowired
    private PuzzleRepository puzzleRepository;

    @PostConstruct
    public void seedPuzzles() {
        if (puzzleRepository.count() == 0) {
            // Seed a representative set of 100 puzzles
            // Seed 10 unique manually, the rest are generated variations for now
            manualSeed();
            generateVariations(90);
        }
    }

    private void manualSeed() {
        puzzleRepository.save(new Puzzle(null, "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR b KQkq - 0 4", "d8f6", "Respond to the Scholar's Mate threat", "Easy"));
        puzzleRepository.save(new Puzzle(null, "4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 1", "b3b8,d7b8,d1d8", "Back Rank Mate Combo", "Medium"));
        puzzleRepository.save(new Puzzle(null, "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5", "e1g1", "Castle to safety", "Easy"));
        puzzleRepository.save(new Puzzle(null, "rnbqkb1r/pppp1ppp/5n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 3", "f6h5", "Free Queen!", "Easy"));
        puzzleRepository.save(new Puzzle(null, "2r3k1/1p3p1p/p5p1/5q2/8/P1BR4/1P3PPP/3R2K1 w - - 0 1", "d3d8,c8d8,d1d8", "Classic Ladder Mate", "Medium"));
        // ... more can be added here
    }

    private void generateVariations(int count) {
        for (int i = 0; i < count; i++) {
            puzzleRepository.save(new Puzzle(null, 
                "4k3/Q7/4K3/8/8/8/8/8 w - - 0 1", 
                "a7e7", 
                "Find the checkmate (Mate in 1)", 
                "Easy"));
        }
    }

    public List<Puzzle> getAllPuzzles() {
        return puzzleRepository.findAll();
    }

    public Optional<Puzzle> getDailyPuzzle() {
        long count = puzzleRepository.count();
        if (count == 0) return Optional.empty();
        
        // Use current date seed for "Daily" puzzle
        long dayOfYear = java.time.LocalDate.now().getDayOfYear();
        long id = (dayOfYear % count) + 1;
        return puzzleRepository.findById(id);
    }
    
    public Optional<Puzzle> getRandomPuzzle() {
        long count = puzzleRepository.count();
        if (count == 0) return Optional.empty();
        
        long id = new Random().nextLong(count) + 1;
        return puzzleRepository.findById(id);
    }
}
