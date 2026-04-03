package com.chess.service;

import com.chess.model.Match;
import com.chess.model.MatchMove;
import com.chess.model.MoveRequest;
import com.chess.repository.MatchMoveRepository;
import com.chess.repository.MatchRepository;
import com.chess.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GameHistoryService {

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private MatchMoveRepository matchMoveRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void saveMove(String gameId, MoveRequest move) {
        // Find or create the match session
        Match match = matchRepository.findByGameId(gameId).orElseGet(() -> {
            Match newMatch = new Match();
            newMatch.setGameId(gameId);
            return matchRepository.save(newMatch);
        });

        // Set players if not already set (for first move)
        if (move.getUserId() != null) {
            userRepository.findById(move.getUserId()).ifPresent(user -> {
                if (move.getColor().equals("w") && match.getWhitePlayer() == null) {
                    match.setWhitePlayer(user);
                    matchRepository.save(match);
                } else if (move.getColor().equals("b") && match.getBlackPlayer() == null) {
                    match.setBlackPlayer(user);
                    matchRepository.save(match);
                }
            });
        }

        // Record the move
        MatchMove matchMove = new MatchMove();
        matchMove.setMatch(match);
        matchMove.setFromSquare(move.getFrom());
        matchMove.setToSquare(move.getTo());
        matchMove.setSan(move.getSan()); // Using SAN for better history
        matchMove.setPiece(move.getPiece());
        matchMove.setColor(move.getColor());
        matchMove.setMoveNumber(match.getMoves().size() + 1);
        
        matchMoveRepository.save(matchMove);
    }

    @Transactional
    public void updateResult(String gameId, String result) {
        matchRepository.findByGameId(gameId).ifPresent(match -> {
            match.setResult(result);
            matchRepository.save(match);
        });
    }
}
