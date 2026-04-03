package com.chess.repository;

import com.chess.model.Match;
import com.chess.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MatchRepository extends JpaRepository<Match, Long> {
    Optional<Match> findByGameId(String gameId);
    List<Match> findByWhitePlayerOrBlackPlayer(User whitePlayer, User blackPlayer);
}
