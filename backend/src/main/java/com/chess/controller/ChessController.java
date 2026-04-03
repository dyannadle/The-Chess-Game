package com.chess.controller;

import com.chess.model.ChatMessage;
import com.chess.model.MoveRequest;
import com.chess.service.GameHistoryService;
import com.chess.service.RoomManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChessController {

    private static final Logger logger = LoggerFactory.getLogger(ChessController.class);

    @Autowired
    private GameHistoryService gameHistoryService;

    @Autowired
    private RoomManager roomManager;

    @MessageMapping("/join/{gameId}/{userId}")
    @SendTo("/topic/game/{gameId}")
    public String joinRoom(@DestinationVariable String gameId, @DestinationVariable String userId) {
        if (roomManager.canJoin(gameId, userId)) {
            roomManager.join(gameId, userId);
            gameHistoryService.registerPlayer(gameId, userId);
            logger.info("User {} joined game {}", userId, gameId);
            return "JOIN_SUCCESS:" + userId;
        } else {
            logger.warn("Room {} is full. User {} rejected.", gameId, userId);
            return "JOIN_ERROR:ROOM_FULL";
        }
    }

    @MessageMapping("/move/{gameId}")
    @SendTo("/topic/game/{gameId}")
    public MoveRequest processMove(@DestinationVariable String gameId, MoveRequest move) {
        logger.info("Game ID: {}, Move: {} to {} New FEN: {}", gameId, move.getFrom(), move.getTo(), move.getFen());
        
        // Persist the move to the database
        gameHistoryService.saveMove(gameId, move);
        
        return move;
    }

    @MessageMapping("/chat/{gameId}")
    @SendTo("/topic/chat/{gameId}")
    public ChatMessage processChat(@DestinationVariable String gameId, ChatMessage message) {
        logger.info("Game ID: {}, Chat from {}: {}", gameId, message.getSender(), message.getText());
        return message;
    }

    @MessageMapping("/result/{gameId}")
    @SendTo("/topic/game/{gameId}")
    public String handleResult(@DestinationVariable String gameId, String result) {
        gameHistoryService.updateResult(gameId, result);
        return result;
    }
}
