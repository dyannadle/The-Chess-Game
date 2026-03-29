package com.chess.repository;

import com.chess.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MatchRepository extends JpaRepository<Match, Long> {
    Optional<Match> findByGameId(String gameId);
}
