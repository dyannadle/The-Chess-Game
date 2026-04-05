// PURPOSE: DTO for in-game chat messages sent over WebSocket (STOMP).
// IMPACT: Carries chat data between players in real-time during a multiplayer match.
//         Used in ChessController.processChat() — received and broadcast to the game room.
// ALTERNATIVE: Add timestamps, message IDs, and read receipts for a richer chat experience.
package com.chess.model;

// PURPOSE: Lombok annotations for boilerplate reduction.
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// PURPOSE: @Data generates getters/setters for all fields. Jackson uses these for JSON conversion.
@Data

// PURPOSE: All-args constructor for convenient creation.
@AllArgsConstructor

// PURPOSE: No-arg constructor required by Jackson for STOMP message deserialization.
@NoArgsConstructor
public class ChatMessage { // Represents an in-game chat message between players.
                           // IMPACT: Part of the real-time communication system — not persisted to the database.

    // PURPOSE: The username of the player who sent this message.
    // IMPACT: Displayed in the chat UI to identify who sent each message.
    //         The frontend compares this with currentUser.username to style "self" vs "other" messages.
    // ALTERNATIVE: Use userId instead for unique identification (usernames could theoretically change).
    private String sender;

    // PURPOSE: The text content of the chat message.
    // IMPACT: Displayed in the chat bubble in the ChessBoard component's chat panel.
    // ALTERNATIVE: Support rich content (emojis, images) or use markdown formatting.
    private String text;

    // PURPOSE: The game room ID this message belongs to.
    // IMPACT: Determines which STOMP topic the message is routed to (/topic/chat/{gameId}).
    //         Ensures messages go only to players in the same game.
    // ALTERNATIVE: Could be inferred from the STOMP destination instead of being in the payload.
    private String gameId;
}
