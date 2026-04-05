// PURPOSE: This file configures the WebSocket (STOMP) messaging infrastructure for real-time multiplayer chess.
// IMPACT: Without this, players cannot send/receive moves, chat messages, or join notifications in real-time.
//         Enables the STOMP protocol over SockJS for browser-compatible bidirectional communication.
// ALTERNATIVE: Use raw WebSockets (no STOMP), Server-Sent Events (SSE), or a third-party service like Pusher/Firebase.
package com.chess.config; // Declares the config sub-package.
                          // IMPACT: Auto-detected by Spring Boot's component scan.

// PURPOSE: Imports @Configuration to mark this class as a bean definition source.
import org.springframework.context.annotation.Configuration;

// PURPOSE: Imports MessageBrokerRegistry — used to configure the STOMP message broker (routing of messages).
// IMPACT: Defines the broker prefixes (/topic) and application destination prefixes (/app).
// ALTERNATIVE: Use an external message broker like RabbitMQ or ActiveMQ for production-grade messaging.
import org.springframework.messaging.simp.config.MessageBrokerRegistry;

// PURPOSE: Imports @EnableWebSocketMessageBroker — activates WebSocket message handling backed by a message broker.
// IMPACT: Enables STOMP protocol support, message routing, and subscription management.
// ALTERNATIVE: @EnableWebSocket for raw WebSocket without STOMP (lower-level, more manual work).
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;

// PURPOSE: Imports StompEndpointRegistry — used to register WebSocket STOMP endpoints.
// IMPACT: Defines the URL (/ws-chess) where clients connect to establish WebSocket connections.
// ALTERNATIVE: Multiple endpoints for different features (e.g., /ws-game, /ws-chat).
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;

// PURPOSE: Imports WebSocketMessageBrokerConfigurer — the interface for WebSocket configuration callbacks.
// IMPACT: Implementing this interface lets us customize the message broker and STOMP endpoints.
// ALTERNATIVE: Extend AbstractWebSocketMessageBrokerConfigurer (deprecated) or use @Configuration with @Bean methods.
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

// PURPOSE: @Configuration marks this as a Spring configuration class.
// IMPACT: Spring processes this during startup to configure WebSocket infrastructure.
@Configuration

// PURPOSE: @EnableWebSocketMessageBroker activates the STOMP-based WebSocket message broker.
// IMPACT: Starts an in-memory message broker, registers STOMP endpoints, enables @MessageMapping in controllers.
// ALTERNATIVE: Use @EnableWebSocket for raw WebSocket (no built-in message routing or subscriptions).
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    // PURPOSE: This class configures STOMP messaging for the multiplayer chess game.
    // IMPACT: All real-time features (move broadcasting, chat, join/leave notifications) depend on this config.
    // ALTERNATIVE: Use Socket.IO (Node.js-based, not native to Spring), or use Spring Integration for complex messaging.

    // PURPOSE: Configures the message broker's routing prefixes.
    // IMPACT: Determines how messages are routed between clients and the server.
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // PURPOSE: Enables a simple in-memory message broker for topics prefixed with "/topic".
        // IMPACT: When a client subscribes to "/topic/game/room1", the broker delivers messages published to that destination.
        //         The simple broker stores subscriptions in memory — not suitable for multi-instance deployments.
        // ALTERNATIVE: config.enableStompBrokerRelay("/topic", "/queue").setRelayHost("rabbitmq-host")
        //              — for production-grade external broker (RabbitMQ/ActiveMQ) with multi-server support.
        config.enableSimpleBroker("/topic");

        // PURPOSE: Sets the prefix for messages bound for @MessageMapping methods in controllers.
        // IMPACT: Client sends to "/app/move/room1" → routes to @MessageMapping("/move/{gameId}") in ChessController.
        //         The "/app" prefix is stripped before matching the @MessageMapping value.
        // ALTERNATIVE: Any prefix works (e.g., "/chess", "/game"), but "/app" is the Spring convention.
        config.setApplicationDestinationPrefixes("/app");
    }

    // PURPOSE: Registers the STOMP WebSocket endpoint that clients connect to.
    // IMPACT: Defines the URL where the frontend's SockJS client establishes its WebSocket connection.
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // PURPOSE: Registers "/ws-chess" as the WebSocket connection endpoint.
        // IMPACT: Frontend connects to http://localhost:8080/ws-chess (or the production URL).
        //         This is the initial HTTP handshake URL, not a message destination.
        // ALTERNATIVE: Multiple endpoints for different features (e.g., addEndpoint("/ws-chat")).
        registry.addEndpoint("/ws-chess")

                // PURPOSE: Restricts which frontend origins can establish WebSocket connections.
                // IMPACT: Only localhost dev servers and Vercel deployments can connect.
                //         Other origins are rejected during the WebSocket handshake.
                //         Must match the CORS origins in SecurityConfig for consistency.
                // ALTERNATIVE: .setAllowedOriginPatterns("*") — allows ALL origins (insecure but simple for dev).
                .setAllowedOriginPatterns("http://localhost:5173", "http://localhost:3000", "https://*.vercel.app", "https://grandmaster-chess-web.vercel.app")

                // PURPOSE: Enables SockJS fallback for browsers that don't support native WebSocket.
                // IMPACT: SockJS tries WebSocket first, then falls back to HTTP long-polling, streaming, etc.
                //         Increases browser compatibility (older browsers, restrictive corporate proxies).
                // ALTERNATIVE: Remove .withSockJS() to use raw WebSocket only (lighter but less compatible).
                //              The frontend would then use new WebSocket("ws://...") instead of new SockJS("http://...").
                .withSockJS();
    }
}
