package com.chess.service;

import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RoomManager {
    // Maps gameId to a set of connected userId's
    private final Map<String, Set<String>> roomPlayers = new ConcurrentHashMap<>();

    public boolean canJoin(String gameId, String userId) {
        Set<String> players = roomPlayers.computeIfAbsent(gameId, k -> Collections.synchronizedSet(new HashSet<>()));
        
        // If user is already in the room, they can "rejoin"
        if (players.contains(userId)) {
            return true;
        }
        
        // Limit to 2 players
        return players.size() < 2;
    }

    public void join(String gameId, String userId) {
        Set<String> players = roomPlayers.computeIfAbsent(gameId, k -> Collections.synchronizedSet(new HashSet<>()));
        players.add(userId);
    }

    public void leave(String gameId, String userId) {
        Set<String> players = roomPlayers.get(gameId);
        if (players != null) {
            players.remove(userId);
            if (players.isEmpty()) {
                roomPlayers.remove(gameId);
            }
        }
    }

    public int getPlayerCount(String gameId) {
        Set<String> players = roomPlayers.get(gameId);
        return players != null ? players.size() : 0;
    }
}
