import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export const useGameSocket = (gameId, onMoveReceived, onChatReceived) => {
    const [connected, setConnected] = useState(false);
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
                    const move = JSON.parse(message.body);
                    onMoveReceived(move);
                });
                
                if (onChatReceived) {
                    client.subscribe(`/topic/chat/${gameId}`, (message) => {
                        const chat = JSON.parse(message.body);
                        onChatReceived(chat);
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

    return { connected, sendMove, sendChat };
};
