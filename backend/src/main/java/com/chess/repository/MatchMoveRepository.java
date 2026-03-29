package com.chess.repository;

import com.chess.model.Match;
import com.chess.model.MatchMove;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MatchMoveRepository extends JpaRepository<MatchMove, Long> {
    List<MatchMove> findByMatchOrderByMoveNumberAsc(Match match);
}
