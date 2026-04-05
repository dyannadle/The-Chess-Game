// PURPOSE: Custom React hook that manages the WebSocket (STOMP over SockJS) connection for real-time multiplayer.
// IMPACT: Provides connect/disconnect lifecycle, message sending (moves & chat), and message receiving.
//         This is the CLIENT-SIDE counterpart to the backend's ChessController and WebSocketConfig.
//         Without this hook, the chess game would have no real-time communication between players.
// ALTERNATIVE: Use Socket.IO, Firebase Realtime Database, or Supabase Realtime for WebSocket alternatives.

// PURPOSE: Imports React hooks: useEffect (side effects), useState (state), useRef (mutable ref that persists across renders).
import { useEffect, useState, useRef } from 'react';

// PURPOSE: Imports the STOMP client library — STOMP is a text-based messaging protocol over WebSocket.
// IMPACT: The Client class manages the STOMP connection, subscriptions, and message publishing.
//         STOMP provides higher-level messaging (pub/sub, topics, headers) on top of raw WebSocket.
// ALTERNATIVE: Use the native WebSocket API for raw WebSocket (no pub/sub, manual message routing).
import { Client } from '@stomp/stompjs';

// PURPOSE: Imports SockJS — a WebSocket emulation library for browser compatibility.
// IMPACT: SockJS tries native WebSocket first, then falls back to HTTP polling/streaming for older browsers.
//         Required because the backend's WebSocketConfig uses .withSockJS().
// ALTERNATIVE: Use native WebSocket (new WebSocket('ws://...')) — works in modern browsers but no fallback.
import SockJS from 'sockjs-client';

// PURPOSE: Determines the backend WebSocket URL, same logic as Auth.jsx's API URL.
// IMPACT: Used to construct the SockJS connection URL: http://localhost:8080/ws-chess
// ALTERNATIVE: Use a shared config module for the backend URL (avoid duplication with Auth.jsx).
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// PURPOSE: Exports the custom hook function with all necessary parameters and callbacks.
// IMPACT: Called in App.jsx: useGameSocket(gameId, userId, onMoveReceived, onChatReceived, onJoinStatus)
//         Returns: { connected, error, sendMove, sendChat } for the calling component to use.
// ALTERNATIVE: Use a React Context/Provider pattern for global WebSocket state access across components.
export const useGameSocket = (gameId, userId, onMoveReceived, onChatReceived, onJoinStatus) => {
    // PURPOSE: Tracks whether the STOMP client is currently connected to the backend.
    // IMPACT: Used to conditionally allow message sending (can't send if not connected).
    //         Also enables UI indicators like "Connected to server" (currently not displayed).
    const [connected, setConnected] = useState(false);

    // PURPOSE: Tracks any error that occurred during the WebSocket connection.
    // IMPACT: Displayed in App.jsx as an error banner if the connection fails.
    const [error, setError] = useState(null);

    // PURPOSE: Stores a reference to the STOMP client instance that persists across re-renders.
    // IMPACT: useRef avoids recreating the client on every render. The .current property holds the client.
    //         Used for sending messages and cleanup (deactivation/disconnection).
    // ALTERNATIVE: Store in state — but state updates trigger re-renders, which is unnecessary for the client.
    const stompClient = useRef(null);

    // PURPOSE: useEffect runs the WebSocket connection logic when the gameId changes.
    // IMPACT: When a user joins a game (gameId becomes non-null), the hook connects to the WebSocket server.
    //         When gameId changes (new game) or becomes null, the previous connection is cleaned up.
    //         The dependency array [gameId] means this re-runs ONLY when gameId changes.
    // ALTERNATIVE: Add userId to the dependency array to reconnect on user changes (currently ignored).
    useEffect(() => {
        // PURPOSE: Guard clause — if no gameId is provided, don't connect (user hasn't joined a game).
        // IMPACT: Prevents unnecessary WebSocket connections on the main menu/dashboard.
        if (!gameId) return;

        // PURPOSE: Creates a SockJS connection to the backend's /ws-chess endpoint.
        // IMPACT: SockJS establishes the initial HTTP handshake, then upgrades to WebSocket if supported.
        //         The URL resolves to: http://localhost:8080/ws-chess (dev) or https://chess-api.onrender.com/ws-chess (prod).
        // ALTERNATIVE: new WebSocket('ws://localhost:8080/ws-chess') for raw WebSocket (no SockJS fallback).
        const socket = new SockJS(`${BACKEND_URL}/ws-chess`);

        // PURPOSE: Creates a STOMP client that uses the SockJS connection as its transport.
        // IMPACT: The client handles STOMP protocol framing, heartbeats, subscriptions, and message routing.
        const client = new Client({
            // PURPOSE: Factory function that returns the SockJS socket for the STOMP client to use.
            // IMPACT: The client calls this when it needs to establish the underlying transport.
            webSocketFactory: () => socket,

            // PURPOSE: Callback fired when the STOMP connection is successfully established.
            // IMPACT: This is where we subscribe to game topics and send the initial JOIN message.
            onConnect: () => {
                // PURPOSE: Logs successful connection for debugging.
                console.log('Connected to WebSocket');

                // PURPOSE: Updates the connected state to true — enables message sending.
                setConnected(true);

                // PURPOSE: Subscribes to the game topic to receive moves, join events, and results.
                // IMPACT: Every message published to /topic/game/{gameId} by the backend is received here.
                //         The subscription callback parses the message and routes it to the appropriate handler.
                // ALTERNATIVE: Use separate subscriptions for moves, joins, and results (cleaner routing).
                client.subscribe(`/topic/game/${gameId}`, (message) => {
                    // PURPOSE: Checks if the message is a JOIN_SUCCESS notification.
                    // IMPACT: Backend sends "JOIN_SUCCESS:42" when a player successfully joins the room.
                    //         Calls onJoinStatus with success status and the userId that joined.
                    if (message.body.startsWith('JOIN_SUCCESS:')) {
                        if (onJoinStatus) onJoinStatus({ status: 'success', userId: message.body.split(':')[1] });
                    // PURPOSE: Checks if the message is a JOIN_ERROR notification.
                    } else if (message.body.startsWith('JOIN_ERROR:')) {
                        // PURPOSE: Notifies the caller about the join error.
                        if (onJoinStatus) onJoinStatus({ status: 'error', message: message.body.split(':')[1] });
                        // PURPOSE: Sets a user-visible error message when the room is full.
                        if (message.body === 'JOIN_ERROR:ROOM_FULL' && onJoinStatus) {
                             setError('Room is full (max 2 players)');
                        }
                    } else {
                        // PURPOSE: Parses the message body as a MoveRequest JSON object.
                        // IMPACT: Converts the incoming JSON string to a JavaScript object.
                        //         Calls onMoveReceived which updates the chess board in ChessBoard.jsx.
                        const move = JSON.parse(message.body);
                        onMoveReceived(move);
                    }
                });
                
                // PURPOSE: Subscribes to the chat topic if a chat handler is provided.
                // IMPACT: Receives chat messages published to /topic/chat/{gameId} by the backend.
                //         Only subscribes if the onChatReceived callback exists (multiplayer mode).
                if (onChatReceived) {
                    client.subscribe(`/topic/chat/${gameId}`, (message) => {
                        // PURPOSE: Parses the chat message JSON and passes it to the chat handler.
                        // IMPACT: ChessBoard.jsx adds this message to its chat state for display.
                        const chat = JSON.parse(message.body);
                        onChatReceived(chat);
                    });
                }

                // PURPOSE: Sends a JOIN message to the backend after connecting.
                // IMPACT: Triggers ChessController.joinRoom() on the server, which adds the player to the room
                //         and registers them in the match database.
                //         Only sends if userId is truthy (logged-in user).
                // ALTERNATIVE: Send join message on a button click instead of automatically on connect.
                if (userId) {
                    client.publish({
                        // PURPOSE: Sends to /app/join/{gameId}/{userId} — mapped to ChessController.joinRoom().
                        // IMPACT: The "/app" prefix is required (configured in WebSocketConfig's setApplicationDestinationPrefixes).
                        destination: `/app/join/${gameId}/${userId}`,
                        body: '' // Empty body — the gameId and userId are in the destination path.
                    });
                }
            },

            // PURPOSE: Callback fired when a STOMP-level error occurs (protocol error, server error frame).
            // IMPACT: Logs the error for debugging. Does NOT handle transport-level errors (network disconnect).
            // ALTERNATIVE: Set the error state here to display it in the UI.
            onStompError: (frame) => {
                console.error('STOMP Error:', frame);
            },

            // PURPOSE: Callback fired when the STOMP connection is lost.
            // IMPACT: Updates the connected state to false — disables message sending.
            //         The client may automatically attempt to reconnect depending on configuration.
            // ALTERNATIVE: Implement reconnection logic with exponential backoff.
            onDisconnect: () => {
                setConnected(false);
                console.log('Disconnected');
            }
        });

        // PURPOSE: Activates the STOMP client — initiates the connection to the backend.
        // IMPACT: Triggers the SockJS handshake and STOMP CONNECT frame exchange.
        client.activate();

        // PURPOSE: Stores the client reference for use in sendMove/sendChat functions.
        stompClient.current = client;

        // PURPOSE: Cleanup function — runs when the component unmounts or gameId changes.
        // IMPACT: Deactivates the STOMP client, closing the WebSocket connection cleanly.
        //         Prevents memory leaks and stale subscriptions from previous game sessions.
        // ALTERNATIVE: Call client.deactivate() in a separate "leave game" handler.
        return () => {
            if (stompClient.current) {
                stompClient.current.deactivate();
            }
        };
    }, [gameId]); // Re-connect if gameId changes

    // PURPOSE: Sends a chess move to the backend via WebSocket.
    // IMPACT: Publishes a MoveRequest JSON to /app/move/{gameId} → backend's ChessController.processMove().
    //         The backend then broadcasts it to all subscribers of /topic/game/{gameId} (both players).
    //         Only sends if the client is connected (prevents errors on disconnected state).
    // ALTERNATIVE: Use REST (POST /api/moves) instead of WebSocket for move sending (higher latency).
    const sendMove = (moveData) => {
        if (stompClient.current && connected) {
            stompClient.current.publish({
                // PURPOSE: Destination mapping: /app/move/{gameId} → @MessageMapping("/move/{gameId}").
                destination: `/app/move/${gameId}`,
                // PURPOSE: Serializes the move data (from, to, fen, san, etc.) and adds the gameId.
                // IMPACT: The spread { ...moveData, gameId } merges the move data with the gameId.
                body: JSON.stringify({ ...moveData, gameId }),
            });
        }
    };

    // PURPOSE: Sends a chat message to the backend via WebSocket.
    // IMPACT: Publishes a ChatMessage JSON to /app/chat/{gameId} → backend's ChessController.processChat().
    //         The backend broadcasts it to all subscribers of /topic/chat/{gameId}.
    const sendChat = (chatData) => {
        if (stompClient.current && connected) {
            stompClient.current.publish({
                // PURPOSE: Destination mapping: /app/chat/{gameId} → @MessageMapping("/chat/{gameId}").
                destination: `/app/chat/${gameId}`,
                // PURPOSE: Serializes the chat data (sender, text) and adds the gameId.
                body: JSON.stringify({ ...chatData, gameId }),
            });
        }
    };

    // PURPOSE: Returns the hook's public interface — state and functions for the calling component.
    // IMPACT: App.jsx destructures: const { connected, error, sendMove, sendChat } = useGameSocket(...).
    //         connected: boolean for UI indicators. error: string for error display.
    //         sendMove: function to send chess moves. sendChat: function to send chat messages.
    return { connected, error, sendMove, sendChat };
};
