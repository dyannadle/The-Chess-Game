package com.chess.controller;

import com.chess.model.Match;
import com.chess.model.MatchMove;
import com.chess.repository.MatchRepository;
import com.chess.repository.MatchMoveRepository;
import com.chess.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@CrossOrigin(origins = "*")
public class MatchController {

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private MatchMoveRepository matchMoveRepository;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{matchId}/pgn")
    public ResponseEntity<byte[]> downloadPgn(@PathVariable Long matchId) {
        return matchRepository.findById(matchId).map(match -> {
            List<MatchMove> moves = matchMoveRepository.findByMatchOrderByMoveNumberAsc(match);
            
            StringBuilder pgn = new StringBuilder();
            pgn.append("[Event \"GrandMaster Match\"]\n");
            pgn.append("[White \"").append(match.getWhitePlayer() != null ? match.getWhitePlayer().getUsername() : "AI").append("\"]\n");
            pgn.append("[Black \"").append(match.getBlackPlayer() != null ? match.getBlackPlayer().getUsername() : "AI").append("\"]\n");
            pgn.append("[Result \"").append(match.getResult() != null ? match.getResult() : "*").append("\"]\n\n");
            
            for (int i = 0; i < moves.size(); i++) {
                if (i % 2 == 0) {
                    pgn.append((i / 2) + 1).append(". ");
                }
                pgn.append(moves.get(i).getSan()).append(" ");
            }
            
            byte[] bytes = pgn.toString().getBytes();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=match_" + matchId + ".pgn")
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(bytes);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Match>> getUserMatches(@PathVariable Long userId) {
        return userRepository.findById(userId).map(user -> {
            List<Match> matches = matchRepository.findByWhitePlayerOrBlackPlayerOrderByIdDesc(user, user);
            return ResponseEntity.ok(matches);
        }).orElse(ResponseEntity.notFound().build());
    }
}
