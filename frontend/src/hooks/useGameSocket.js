import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export const useGameSocket = (gameId, userId, onMoveReceived, onChatReceived, onJoinStatus) => {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const stompClient = useRef(null);

    useEffect(() => {
        if (!gameId) return;

        const socket = new SockJS(`${BACKEND_URL}/ws-chess`);
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                console.log('Connected to WebSocket');
                setConnected(true);
                client.subscribe(`/topic/game/${gameId}`, (message) => {
                    if (message.body.startsWith('JOIN_SUCCESS:')) {
                        if (onJoinStatus) onJoinStatus({ status: 'success', userId: message.body.split(':')[1] });
                    } else if (message.body.startsWith('JOIN_ERROR:')) {
                        if (onJoinStatus) onJoinStatus({ status: 'error', message: message.body.split(':')[1] });
                        if (message.body === 'JOIN_ERROR:ROOM_FULL' && onJoinStatus) {
                             setError('Room is full (max 2 players)');
                        }
                    } else {
                        const move = JSON.parse(message.body);
                        onMoveReceived(move);
                    }
                });
                
                if (onChatReceived) {
                    client.subscribe(`/topic/chat/${gameId}`, (message) => {
                        const chat = JSON.parse(message.body);
                        onChatReceived(chat);
                    });
                }

                // Send JOIN message
                if (userId) {
                    client.publish({
                        destination: `/app/join/${gameId}/${userId}`,
                        body: ''
                    });
                }
            },
            onStompError: (frame) => {
                console.error('STOMP Error:', frame);
            },
            onDisconnect: () => {
                setConnected(false);
                console.log('Disconnected');
            }
        });

        client.activate();
        stompClient.current = client;

        return () => {
            if (stompClient.current) {
                stompClient.current.deactivate();
            }
        };
    }, [gameId]); // Re-connect if gameId changes

    const sendMove = (moveData) => {
        if (stompClient.current && connected) {
            stompClient.current.publish({
                destination: `/app/move/${gameId}`,
                body: JSON.stringify({ ...moveData, gameId }),
            });
        }
    };

    const sendChat = (chatData) => {
        if (stompClient.current && connected) {
            stompClient.current.publish({
                destination: `/app/chat/${gameId}`,
                body: JSON.stringify({ ...chatData, gameId }),
            });
        }
    };

    return { connected, error, sendMove, sendChat };
};
