// PURPOSE: Spring Data JPA repository for the MatchMove entity.
// IMPACT: Provides database access for individual chess moves within a match.
//         Used by GameHistoryService.saveMove() and MatchController.downloadPgn().
// ALTERNATIVE: Access moves via Match.getMoves() (JPA relationship) instead of a separate repository.
package com.chess.repository;

// PURPOSE: Imports the Match entity — used as a query parameter to find moves for a specific match.
import com.chess.model.Match;

// PURPOSE: Imports the MatchMove entity that this repository manages.
import com.chess.model.MatchMove;

// PURPOSE: Imports JpaRepository for auto-generated CRUD operations.
import org.springframework.data.jpa.repository.JpaRepository;

// PURPOSE: Imports List for multi-result queries.
import java.util.List;

// PURPOSE: Repository interface for MatchMove entities. Spring Data generates the implementation.
// IMPACT: Enables saving and querying individual chess moves in the database.
public interface MatchMoveRepository extends JpaRepository<MatchMove, Long> {

    // PURPOSE: Finds all moves for a specific match, sorted by move number ascending (chronological order).
    // IMPACT: Spring generates: SELECT * FROM match_moves WHERE match_id = ? ORDER BY move_number ASC
    //         Used by MatchController.downloadPgn() to generate PGN with moves in the correct order.
    //         The Match parameter is resolved to its ID by Hibernate automatically.
    // ALTERNATIVE: @Query("SELECT mm FROM MatchMove mm WHERE mm.match = :match ORDER BY mm.moveNumber ASC")
    //              Or use match.getMoves() with @OrderBy("moveNumber ASC") on the entity relationship.
    List<MatchMove> findByMatchOrderByMoveNumberAsc(Match match);
}
