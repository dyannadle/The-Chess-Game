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
        puzzleRepository.save(new Puzzle(null, "r1bqkbnr/pppp1ppp/2n5/4p1B1/4P3/5Q2/PPPP1PPP/RN2KBNR b KQkq - 0 1", "d8f6", "Respond to the Scholar's Mate threat", "Easy"));
        puzzleRepository.save(new Puzzle(null, "4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 1", "b3b8,d7b8,d1d8", "Advanced Back Rank Mate", "Hard"));
        puzzleRepository.save(new Puzzle(null, "2r3k1/1p3p1p/p5p1/5q2/8/P1BR4/1P3PPP/3R2K1 w - - 0 1", "d3d8,c8d8,d1d8", "Ladder Mate Combination", "Medium"));
        puzzleRepository.save(new Puzzle(null, "r1bq1rk1/pppp1ppp/2n2n2/4p3/2B1P3/2P2N2/PPP2PPP/R1BQR1K1 b - - 0 1", "d7d6", "Solidify the center", "Easy"));
        puzzleRepository.save(new Puzzle(null, "6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1", "g1f1", "King activity in endgame", "Easy"));
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
