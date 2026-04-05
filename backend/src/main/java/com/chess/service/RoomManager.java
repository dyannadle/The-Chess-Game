// PURPOSE: In-memory service that manages game room membership — tracks which players are in which rooms.
// IMPACT: Enforces the 2-player limit per chess game and supports player reconnection.
//         Without this, unlimited players could join a room, breaking the chess game logic.
// ALTERNATIVE: Use Redis or a database for room state persistence (survives server restarts).
//              Use Spring Session with WebSocket for automatic session tracking.
package com.chess.service;

// PURPOSE: Imports @Service — marks this class as a Spring-managed service bean.
import org.springframework.stereotype.Service;

// PURPOSE: Imports Collections.synchronizedSet — wraps a HashSet for thread-safe access.
// IMPACT: Multiple players can join rooms concurrently, so thread safety is critical.
import java.util.Collections;

// PURPOSE: Imports HashSet — the underlying set implementation for tracking player IDs.
import java.util.HashSet;

// PURPOSE: Imports Map — the interface for the roomPlayers map.
import java.util.Map;

// PURPOSE: Imports Set — the interface for player sets within each room.
import java.util.Set;

// PURPOSE: Imports ConcurrentHashMap — a thread-safe Map implementation.
// IMPACT: Ensures safe concurrent access when multiple players join/leave rooms simultaneously.
// ALTERNATIVE: Use synchronized blocks with a regular HashMap (more verbose, same effect).
import java.util.concurrent.ConcurrentHashMap;

// PURPOSE: @Service registers this class as a singleton Spring bean.
// IMPACT: A single instance manages ALL game rooms across the application.
//         WARNING: Single-server only — if you deploy multiple backend instances, each has its own RoomManager.
// ALTERNATIVE: Use Redis with Spring Data Redis for distributed room state across multiple servers.
@Service
public class RoomManager { // Manages multiplayer game room membership in-memory.
                           // IMPACT: Core multiplayer gatekeeper — prevents >2 players per chess game.

    // PURPOSE: The main data structure — maps game room IDs to sets of player IDs.
    // IMPACT: Example state: { "chess-room-1": {"42", "87"}, "chess-room-2": {"15"} }
    //         ConcurrentHashMap ensures thread-safe reads/writes for the outer map.
    //         Each inner Set is wrapped in Collections.synchronizedSet for thread-safe membership operations.
    // ALTERNATIVE: Use Guava's Multimap or a cache (Caffeine/Ehcache) with TTL for automatic room cleanup.
    private final Map<String, Set<String>> roomPlayers = new ConcurrentHashMap<>();

    // PURPOSE: Checks whether a player can join a specific game room.
    // IMPACT: Returns true if: (a) the player is already in the room (reconnection), or (b) the room has < 2 players.
    //         Called by ChessController.joinRoom() before processing the join.
    // ALTERNATIVE: Add additional checks: is the player already in another room? Is the game already finished?
    public boolean canJoin(String gameId, String userId) {
        // PURPOSE: Gets or creates the player set for this room.
        // IMPACT: computeIfAbsent atomically creates a new synchronized set if the room doesn't exist yet.
        //         This avoids race conditions where two players try to create the same room simultaneously.
        // ALTERNATIVE: Use getOrDefault(gameId, new HashSet<>()) — but this doesn't persist the new set in the map.
        Set<String> players = roomPlayers.computeIfAbsent(gameId, k -> Collections.synchronizedSet(new HashSet<>()));
        
        // PURPOSE: Allows reconnection — if the player is already in the room, they can rejoin.
        // IMPACT: Handles browser refresh, network reconnection, or tab switching without losing room access.
        // ALTERNATIVE: Track player sessions and validate session tokens instead of just userId.
        if (players.contains(userId)) {
            return true;
        }
        
        // PURPOSE: Enforces the 2-player maximum for a standard chess game.
        // IMPACT: Returns false (room full) if there are already 2 different players.
        //         The constant "2" could be made configurable for future game variants (e.g., 4-player chess).
        // ALTERNATIVE: Make the limit configurable: private static final int MAX_PLAYERS_PER_ROOM = 2;
        return players.size() < 2;
    }

    // PURPOSE: Adds a player to a game room.
    // IMPACT: The player's userId is added to the room's player set.
    //         HashSet.add() is idempotent — adding the same player twice has no effect (no duplicates).
    //         Called by ChessController.joinRoom() after canJoin() returns true.
    // ALTERNATIVE: Return a boolean or Room object to indicate success/failure or provide room metadata.
    public void join(String gameId, String userId) {
        // PURPOSE: Gets or creates the player set for this room (same pattern as canJoin).
        Set<String> players = roomPlayers.computeIfAbsent(gameId, k -> Collections.synchronizedSet(new HashSet<>()));

        // PURPOSE: Adds the player to the room's set.
        // IMPACT: After this, players.size() increases by 1 (unless the player was already in the set).
        players.add(userId);
    }

    // PURPOSE: Removes a player from a game room (e.g., on disconnect or game end).
    // IMPACT: The player's userId is removed from the room's player set.
    //         If the room becomes empty, it's cleaned up (removed from the map) to free memory.
    //         NOTE: This method is currently NOT called anywhere in the codebase.
    //         It would need to be wired to a WebSocket disconnect event handler.
    // ALTERNATIVE: Use @EventListener(SessionDisconnectEvent.class) to auto-remove players on disconnect.
    public void leave(String gameId, String userId) {
        // PURPOSE: Gets the player set for the room. Returns null if the room doesn't exist.
        Set<String> players = roomPlayers.get(gameId);

        if (players != null) {
            // PURPOSE: Removes the player from the room.
            players.remove(userId);

            // PURPOSE: Cleans up empty rooms to prevent memory leaks.
            // IMPACT: If no players remain, the room entry is removed from the ConcurrentHashMap.
            // ALTERNATIVE: Use a TTL-based cache that auto-expires rooms after inactivity.
            if (players.isEmpty()) {
                roomPlayers.remove(gameId);
            }
        }
    }

    // PURPOSE: Returns the number of players currently in a specific room.
    // IMPACT: Could be used to show "1/2 players" in a lobby UI (currently unused in the frontend).
    // ALTERNATIVE: Return the full Set<String> of player IDs for more detailed information.
    public int getPlayerCount(String gameId) {
        // PURPOSE: Gets the player set for the room, returns 0 if the room doesn't exist.
        Set<String> players = roomPlayers.get(gameId);
        return players != null ? players.size() : 0;
    }
}
