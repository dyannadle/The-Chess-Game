package com.chess.controller;

import com.chess.model.ChatMessage;
import com.chess.model.MoveRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChessController {

    private static final Logger logger = LoggerFactory.getLogger(ChessController.class);

    @MessageMapping("/move/{gameId}")
    @SendTo("/topic/game/{gameId}")
    public MoveRequest processMove(@DestinationVariable String gameId, MoveRequest move) {
        logger.info("Game ID: {}, Move: {} to {} New FEN: {}", gameId, move.getFrom(), move.getTo(), move.getFen());
        // For now, we trust the client and broadcast the new move + board state (FEN)
        return move;
    }

    @MessageMapping("/chat/{gameId}")
    @SendTo("/topic/chat/{gameId}")
    public ChatMessage processChat(@DestinationVariable String gameId, ChatMessage message) {
        logger.info("Game ID: {}, Chat from {}: {}", gameId, message.getSender(), message.getText());
        return message;
    }
}
