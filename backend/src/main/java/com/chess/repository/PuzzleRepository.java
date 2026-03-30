package com.chess.repository;

import com.chess.model.Puzzle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PuzzleRepository extends JpaRepository<Puzzle, Long> {
    Optional<Puzzle> findById(Long id);
}
