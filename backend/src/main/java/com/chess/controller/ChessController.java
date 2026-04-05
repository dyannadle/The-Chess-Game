// PURPOSE: This is the WebSocket STOMP controller that handles real-time game events (moves, chat, joins, results).
// IMPACT: Receives messages from players via STOMP and broadcasts them to all subscribers of the game room.
//         This is the REAL-TIME ENGINE of the multiplayer chess game.
// ALTERNATIVE: Use REST endpoints with polling (slow, high latency), or Server-Sent Events (one-directional only).
package com.chess.controller;

// PURPOSE: Imports the ChatMessage model — carries sender, text, and gameId for in-game chat.
import com.chess.model.ChatMessage;

// PURPOSE: Imports the MoveRequest model — carries all data about a chess move (from, to, FEN, SAN, etc.).
import com.chess.model.MoveRequest;

// PURPOSE: Imports the GameHistoryService — persists moves and match results to the database.
// IMPACT: Every move and result is saved for match replay and history features.
import com.chess.service.GameHistoryService;

// PURPOSE: Imports the RoomManager — manages which players are in which game rooms (in-memory).
// IMPACT: Enforces the 2-player limit per game room and tracks room membership.
import com.chess.service.RoomManager;

// PURPOSE: Imports SLF4J Logger — the logging facade for structured log output.
// IMPACT: Logs game events (joins, moves, chats) for debugging and monitoring.
// ALTERNATIVE: Use java.util.logging (JUL) or Log4j2 directly, but SLF4J is the Spring Boot standard.
import org.slf4j.Logger;

// PURPOSE: Imports the LoggerFactory — creates Logger instances for specific classes.
// IMPACT: Creates a logger named "com.chess.controller.ChessController" for filtering logs by class.
import org.slf4j.LoggerFactory;

// PURPOSE: Imports @Autowired for dependency injection.
import org.springframework.beans.factory.annotation.Autowired;

// PURPOSE: Imports @DestinationVariable — extracts path variables from STOMP message destinations.
// IMPACT: Equivalent to @PathVariable for REST, but for WebSocket message destinations.
//         Example: /app/move/{gameId} → @DestinationVariable String gameId
// ALTERNATIVE: Parse the destination string manually from MessageHeaders (complex, error-prone).
import org.springframework.messaging.handler.annotation.DestinationVariable;

// PURPOSE: Imports @MessageMapping — maps STOMP messages to handler methods.
// IMPACT: When a client sends to "/app/move/room1", this annotation routes it to processMove().
//         The "/app" prefix is stripped (configured in WebSocketConfig), so only "/move/{gameId}" is matched.
// ALTERNATIVE: Implement a custom MessageHandler for low-level message processing.
import org.springframework.messaging.handler.annotation.MessageMapping;

// PURPOSE: Imports @SendTo — specifies the destination where the return value is published.
// IMPACT: The return value is broadcast to ALL clients subscribed to the specified topic.
//         Example: processMove() returns a MoveRequest → published to "/topic/game/room1".
// ALTERNATIVE: Use SimpMessagingTemplate.convertAndSend() for programmatic sending (more flexible).
import org.springframework.messaging.handler.annotation.SendTo;

// PURPOSE: Imports @Controller — marks this class as a Spring MVC controller.
// IMPACT: Unlike @RestController, @Controller is used here because WebSocket handlers don't return HTTP responses.
//         The @MessageMapping methods handle STOMP messages, not HTTP requests.
// ALTERNATIVE: @RestController would also work but is semantically incorrect for WebSocket handlers.
import org.springframework.stereotype.Controller;

// PURPOSE: @Controller registers this class as a Spring-managed bean that handles messages.
// IMPACT: Spring routes incoming STOMP messages to @MessageMapping methods in this class.
@Controller
public class ChessController { // The real-time game event handler for multiplayer chess.
                                // IMPACT: All player-to-player communication flows through this controller.

    // PURPOSE: Creates a static logger instance for this class.
    // IMPACT: Logs are tagged with the class name for easy filtering in log aggregation tools.
    // ALTERNATIVE: Use @Slf4j Lombok annotation to auto-generate this logger field.
    private static final Logger logger = LoggerFactory.getLogger(ChessController.class);

    // PURPOSE: Injects the GameHistoryService for persisting game data to the database.
    // IMPACT: Each move and result is saved, enabling match replay and history features.
    @Autowired
    private GameHistoryService gameHistoryService;

    // PURPOSE: Injects the RoomManager for tracking which players are in which game rooms.
    // IMPACT: Enforces the 2-player limit and enables reconnection to existing rooms.
    @Autowired
    private RoomManager roomManager;

    // PURPOSE: Handles player join requests. Triggered when a client sends a message to "/app/join/{gameId}/{userId}".
    // IMPACT: Adds the player to the room if space is available, registers them as a match participant.
    //         The return value is broadcast to ALL subscribers of "/topic/game/{gameId}".
    // ALTERNATIVE: Use a separate "/topic/join/{gameId}" channel for join events vs game events.
    @MessageMapping("/join/{gameId}/{userId}")
    @SendTo("/topic/game/{gameId}")
    public String joinRoom(@DestinationVariable String gameId, @DestinationVariable String userId) {
        // PURPOSE: Checks if the player can join the specified room (room has < 2 players or player already in room).
        // IMPACT: Prevents a third player from joining a 2-player chess game.
        // ALTERNATIVE: Use a database-backed room system with persistent room state (survives server restarts).
        if (roomManager.canJoin(gameId, userId)) {
            // PURPOSE: Adds the player to the room's in-memory player set.
            // IMPACT: The room now tracks this userId as a participant.
            roomManager.join(gameId, userId);

            // PURPOSE: Registers this player as a participant in the database match record.
            // IMPACT: Links the User entity to the Match entity (white or black player slot).
            //         This enables match history retrieval by user ID.
            // ALTERNATIVE: Register players only on their first move instead of on join (lazy registration).
            gameHistoryService.registerPlayer(gameId, userId);

            // PURPOSE: Logs the join event for debugging and monitoring.
            // IMPACT: Produces: "User 42 joined game room1" in the server logs.
            logger.info("User {} joined game {}", userId, gameId);

            // PURPOSE: Returns a success message that is broadcast to all players in the room.
            // IMPACT: Frontend parses "JOIN_SUCCESS:42" to update the UI (e.g., show "Player joined").
            // ALTERNATIVE: Return a structured JSON object instead of a plain string for better parsing.
            return "JOIN_SUCCESS:" + userId;
        } else {
            // PURPOSE: Logs that the room is full and the join was rejected.
            logger.warn("Room {} is full. User {} rejected.", gameId, userId);

            // PURPOSE: Returns an error message broadcast to the room.
            // IMPACT: Frontend checks for "JOIN_ERROR:ROOM_FULL" and shows an error to the rejected player.
            // ALTERNATIVE: Throw an exception and use a @MessageExceptionHandler for error handling.
            return "JOIN_ERROR:ROOM_FULL";
        }
    }

    // PURPOSE: Handles chess move messages. Triggered when a client sends to "/app/move/{gameId}".
    // IMPACT: Persists the move to the database and broadcasts it to all players in the room.
    //         This is the core multiplayer sync mechanism — Player A's move is relayed to Player B.
    // ALTERNATIVE: Validate the move on the server side using a chess engine before broadcasting
    //              (currently, validation happens only on the client with chess.js).
    @MessageMapping("/move/{gameId}")
    @SendTo("/topic/game/{gameId}")
    public MoveRequest processMove(@DestinationVariable String gameId, MoveRequest move) {
        // PURPOSE: Logs the move details for debugging.
        // IMPACT: Produces: "Game ID: room1, Move: e2 to e4 New FEN: rnbqkbnr/..." in server logs.
        logger.info("Game ID: {}, Move: {} to {} New FEN: {}", gameId, move.getFrom(), move.getTo(), move.getFen());
        
        // PURPOSE: Persists the move to the database for match history and replay features.
        // IMPACT: Creates a MatchMove record linked to the Match. Enables move-by-move replay later.
        //         If the match doesn't exist yet, GameHistoryService creates it automatically.
        // ALTERNATIVE: Batch-save moves at game end instead of per-move (reduces DB writes but risks data loss).
        gameHistoryService.saveMove(gameId, move);
        
        // PURPOSE: Returns the MoveRequest, which @SendTo broadcasts to "/topic/game/{gameId}".
        // IMPACT: All subscribers (both players) receive this move, including the sender.
        //         The sender's frontend ignores its own broadcasts based on userId comparison.
        // ALTERNATIVE: Return a stripped-down response (e.g., only from, to, san) to reduce bandwidth.
        return move;
    }

    // PURPOSE: Handles in-game chat messages. Triggered when a client sends to "/app/chat/{gameId}".
    // IMPACT: Broadcasts chat messages to all players in the specified game room.
    // ALTERNATIVE: Use a separate chat service or a persistent chat history with database storage.
    @MessageMapping("/chat/{gameId}")
    @SendTo("/topic/chat/{gameId}")
    public ChatMessage processChat(@DestinationVariable String gameId, ChatMessage message) {
        // PURPOSE: Logs the chat message for monitoring.
        // IMPACT: Produces: "Game ID: room1, Chat from Alice: hello" in server logs.
        logger.info("Game ID: {}, Chat from {}: {}", gameId, message.getSender(), message.getText());

        // PURPOSE: Returns the ChatMessage, which @SendTo broadcasts to "/topic/chat/{gameId}".
        // IMPACT: Both players receive the chat message in their chat panel.
        // ALTERNATIVE: Add server-side timestamps or profanity filtering before broadcasting.
        return message;
    }

    // PURPOSE: Handles game result submissions. Triggered when a client sends to "/app/result/{gameId}".
    // IMPACT: Updates the match result (WIN/LOSS/DRAW) in the database and broadcasts it to the room.
    // ALTERNATIVE: Determine the result server-side by analyzing the FEN position (more authoritative).
    @MessageMapping("/result/{gameId}")
    @SendTo("/topic/game/{gameId}")
    public String handleResult(@DestinationVariable String gameId, String result) {
        // PURPOSE: Updates the match result in the database (e.g., "WHITE_WIN", "BLACK_WIN", "DRAW").
        // IMPACT: The match record's result field is updated from "IN_PROGRESS" to the final result.
        //         This data appears in the match history UI.
        // ALTERNATIVE: Also update user win/loss/xp stats here (currently not implemented).
        gameHistoryService.updateResult(gameId, result);

        // PURPOSE: Returns the result string, broadcast to all players in the room.
        // IMPACT: Frontend can show a "You Won!" or "You Lost!" notification.
        return result;
    }
}
