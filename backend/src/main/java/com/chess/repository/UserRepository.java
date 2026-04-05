// PURPOSE: Spring Data JPA repository interface for the User entity.
// IMPACT: Provides database CRUD operations for the "users" table WITHOUT writing any SQL or implementation code.
//         Spring Data JPA auto-generates the implementation class at runtime using dynamic proxies.
//         Without this, AuthController cannot look up users by username or save new users.
// ALTERNATIVE: Use JdbcTemplate for raw SQL, EntityManager for JPQL, or MyBatis for XML-mapped SQL.
package com.chess.repository;

// PURPOSE: Imports the User JPA entity — the entity this repository manages.
import com.chess.model.User;

// PURPOSE: Imports JpaRepository — the core Spring Data interface providing CRUD + pagination + sorting.
// IMPACT: Extends CrudRepository + PagingAndSortingRepository. Provides: save(), findById(), findAll(), delete(), count(), etc.
//         The generic parameters <User, Long> specify: entity type = User, primary key type = Long.
// ALTERNATIVE: Extend CrudRepository<User, Long> for basic CRUD without pagination/sorting.
//              Extend JpaSpecificationExecutor<User> for dynamic query building.
import org.springframework.data.jpa.repository.JpaRepository;

// PURPOSE: Imports Optional — a null-safe wrapper for query results that may or may not exist.
import java.util.Optional;

// PURPOSE: This interface declaration triggers Spring Data JPA to generate a full implementation at startup.
// IMPACT: Spring scans for interfaces extending JpaRepository, creates proxy implementations, and registers them as beans.
//         AuthController can then @Autowired UserRepository and use all methods without writing any SQL.
// ALTERNATIVE: Add @Repository annotation (optional — JpaRepository extensions are auto-detected).
public interface UserRepository extends JpaRepository<User, Long> {
    // JpaRepository<User, Long> provides these methods automatically (no code needed):
    //   - save(User user) → INSERT or UPDATE
    //   - findById(Long id) → SELECT * FROM users WHERE id = ?
    //   - findAll() → SELECT * FROM users
    //   - deleteById(Long id) → DELETE FROM users WHERE id = ?
    //   - count() → SELECT COUNT(*) FROM users
    //   - existsById(Long id) → SELECT EXISTS(...)

    // PURPOSE: Custom "derived query method" — Spring Data generates SQL from the method name.
    // IMPACT: Spring parses "findByUsername" and generates: SELECT * FROM users WHERE username = ?
    //         Returns Optional.empty() if no user with that username exists.
    //         Used by AuthController.login() and AuthController.signup() to find/check users.
    // ALTERNATIVE: @Query("SELECT u FROM User u WHERE u.username = :username") for explicit JPQL.
    //              @Query(value = "SELECT * FROM users WHERE username = ?1", nativeQuery = true) for raw SQL.
    Optional<User> findByUsername(String username);
}
