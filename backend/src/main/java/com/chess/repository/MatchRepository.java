// PURPOSE: Spring Data JPA repository interface for the Match entity.
// IMPACT: Provides database access for chess match records — linking games to players and tracking results.
//         Used by GameHistoryService (find/create matches), MatchController (fetch history, PGN).
// ALTERNATIVE: Use a custom DAO class with EntityManager for complex queries.
package com.chess.repository;

// PURPOSE: Imports the Match entity that this repository manages.
import com.chess.model.Match;

// PURPOSE: Imports the User entity — used as a parameter type in the findByWhitePlayerOrBlackPlayer query.
import com.chess.model.User;

// PURPOSE: Imports JpaRepository — provides CRUD + pagination + sorting for Match entities.
import org.springframework.data.jpa.repository.JpaRepository;

// PURPOSE: Imports List for query methods that return multiple results.
import java.util.List;

// PURPOSE: Imports Optional for query methods that return 0 or 1 result.
import java.util.Optional;

// PURPOSE: Repository interface for Match entities. Spring Data auto-generates the implementation.
// IMPACT: All match-related database queries in the app go through this interface.
public interface MatchRepository extends JpaRepository<Match, Long> {

    // PURPOSE: Finds a match by its room/session identifier (e.g., "chess-room-1").
    // IMPACT: Spring generates: SELECT * FROM matches WHERE game_id = ?
    //         Used by GameHistoryService to find an existing in-progress match or create a new one.
    //         Returns Optional.empty() if no match with that gameId exists.
    // ALTERNATIVE: @Query("SELECT m FROM Match m WHERE m.gameId = :gameId AND m.result = 'IN_PROGRESS'")
    //              — to filter only active matches at the query level.
    Optional<Match> findByGameId(String gameId);

    // PURPOSE: Finds all matches where a user was either the white OR black player, ordered by newest first.
    // IMPACT: Spring generates: SELECT * FROM matches WHERE white_player_id = ? OR black_player_id = ? ORDER BY id DESC
    //         Used by MatchController.getUserMatches() to populate the match history tab.
    //         NOTE: Both parameters are the SAME user — this is how Spring Data handles "OR" queries with entity params.
    // ALTERNATIVE: @Query("SELECT m FROM Match m WHERE m.whitePlayer = :user OR m.blackPlayer = :user ORDER BY m.id DESC")
    //              — explicit JPQL for clarity.
    //              Add Pageable parameter for pagination: ...OrderByIdDesc(User w, User b, Pageable pageable)
    List<Match> findByWhitePlayerOrBlackPlayerOrderByIdDesc(User whitePlayer, User blackPlayer);
}
