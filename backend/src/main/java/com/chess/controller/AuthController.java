// PURPOSE: This is the REST controller for user authentication (login and signup).
// IMPACT: Handles HTTP POST requests at /api/auth/login and /api/auth/signup.
//         Without this file, users cannot create accounts or log in to the chess platform.
// ALTERNATIVE: Use Spring Security's built-in form login, OAuth2 (Google/GitHub login), or JWT-based auth with a filter.
package com.chess.controller; // Part of the controller layer — handles incoming HTTP requests.
                              // IMPACT: Spring MVC dispatches requests to methods in this package.

// PURPOSE: Imports the AuthResponse DTO — the JSON response sent back to the frontend after login/signup.
// IMPACT: Carries username, wins, losses, xp, and a message to the client.
// ALTERNATIVE: Return the User entity directly (exposes password hash — SECURITY RISK).
import com.chess.model.AuthResponse;

// PURPOSE: Imports the LoginRequest DTO — the JSON body received from the frontend during login/signup.
// IMPACT: Deserializes the incoming { "username": "...", "password": "..." } JSON body.
// ALTERNATIVE: Use @RequestParam for form-encoded data, or Map<String, String> for untyped access.
import com.chess.model.LoginRequest;

// PURPOSE: Imports the User JPA entity — represents a row in the "users" database table.
// IMPACT: Used to query, create, and persist user records in PostgreSQL.
// ALTERNATIVE: A separate UserDTO for API responses and User entity for DB only (full DTO pattern).
import com.chess.model.User;

// PURPOSE: Imports UserRepository — the database access layer for User entities.
// IMPACT: Provides findByUsername() and save() methods backed by Spring Data JPA.
// ALTERNATIVE: Use EntityManager directly, or JdbcTemplate for raw SQL queries.
import com.chess.repository.UserRepository;

// PURPOSE: Imports @Autowired — enables automatic dependency injection of Spring beans.
// IMPACT: Spring automatically provides instances of UserRepository and PasswordEncoder.
// ALTERNATIVE: Constructor injection (recommended): AuthController(UserRepository repo, PasswordEncoder enc)
//              — makes dependencies explicit and supports immutability.
import org.springframework.beans.factory.annotation.Autowired;

// PURPOSE: Imports ResponseEntity — a wrapper for HTTP responses with status codes and bodies.
// IMPACT: Enables returning specific HTTP status codes (200 OK, 400 Bad Request, 401 Unauthorized).
// ALTERNATIVE: Return plain objects (always 200), or use @ResponseStatus annotation on exceptions.
import org.springframework.http.ResponseEntity;

// PURPOSE: Imports PasswordEncoder — the abstraction for password hashing (implemented by BCryptPasswordEncoder).
// IMPACT: Used to hash passwords during signup and verify them during login.
//         Coding to the interface allows easy swapping of the encoder implementation.
// ALTERNATIVE: Hash passwords manually with MessageDigest (insecure — no salting, no adaptive work factor).
import org.springframework.security.crypto.password.PasswordEncoder;

// PURPOSE: Imports Spring MVC annotations for REST controller configuration.
//          @RestController = @Controller + @ResponseBody (return values are auto-serialized to JSON).
//          @RequestMapping = base URL path for all endpoints in this controller.
//          @PostMapping = maps HTTP POST requests to handler methods.
//          @RequestBody = deserializes the JSON request body into a Java object.
//          @CrossOrigin = enables CORS for this controller (redundant with SecurityConfig's global CORS).
// IMPACT: These annotations wire this class into Spring MVC's request handling pipeline.
// ALTERNATIVE: Use @Controller + @ResponseBody separately, or configure routes programmatically with RouterFunction.
import org.springframework.web.bind.annotation.*;

// PURPOSE: Imports Optional — a container object that may or may not contain a value.
// IMPACT: Used by findByUsername() to safely handle the case where a user doesn't exist.
// ALTERNATIVE: Return null and check with if (user != null) — more error-prone, NPE risk.
import java.util.Optional;

// PURPOSE: @RestController marks this class as a REST API controller. Every method returns JSON by default.
// IMPACT: All handler methods in this class automatically serialize return values to JSON via Jackson.
// ALTERNATIVE: @Controller + @ResponseBody on each method (more verbose, same result).
@RestController

// PURPOSE: @RequestMapping sets the base URL path for all endpoints in this controller.
// IMPACT: All endpoints here are prefixed with /api/auth — e.g., /api/auth/login, /api/auth/signup.
// ALTERNATIVE: Use @PostMapping("/api/auth/login") directly without a class-level prefix.
@RequestMapping("/api/auth")

// PURPOSE: @CrossOrigin enables CORS for requests from specific origins to this controller.
// IMPACT: Allows the frontend at localhost:3000 and Vercel to make requests to /api/auth/*.
//         NOTE: This is REDUNDANT with the global CORS config in SecurityConfig.java.
//         Having both doesn't cause errors — the most permissive config wins.
// ALTERNATIVE: Remove this and rely solely on SecurityConfig's global CORS (recommended for consistency).
@CrossOrigin(origins = {"http://localhost:3000", "https://*.vercel.app"})
public class AuthController { // Handles user registration and login.
                               // IMPACT: The single entry point for all authentication-related API calls.

    // PURPOSE: Injects the UserRepository bean — provides database access for the User entity.
    // IMPACT: Enables querying users by username and saving new users to the database.
    // ALTERNATIVE: Constructor injection: public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder)
    //              — preferred for testability and immutability.
    @Autowired
    private UserRepository userRepository;

    // PURPOSE: Injects the PasswordEncoder bean (BCryptPasswordEncoder from SecurityConfig).
    // IMPACT: Used to hash passwords on signup and verify passwords on login.
    //         The encoder's matches() method is the MAIN BOTTLENECK for slow logins when strength is too high.
    // ALTERNATIVE: Constructor injection (preferred) — makes testing with mocks easier.
    @Autowired
    private PasswordEncoder passwordEncoder;

    // PURPOSE: Handles HTTP POST requests to /api/auth/signup — creates a new user account.
    // IMPACT: Registers a new user with a hashed password in the database.
    //         Returns user stats (wins, losses, xp) on success, or 400 Bad Request if username is taken.
    // ALTERNATIVE: Use a @Service layer (AuthService) between the controller and repository for cleaner architecture.
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody LoginRequest request) {
        // PURPOSE: Checks if a user with the given username already exists in the database.
        // IMPACT: Prevents duplicate usernames. findByUsername() executes: SELECT * FROM users WHERE username = ?
        //         Uses Optional.isPresent() for null-safe checking.
        // ALTERNATIVE: Use a unique constraint violation catch block instead of pre-checking (race condition safe).
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            // PURPOSE: Returns HTTP 400 Bad Request with an error message.
            // IMPACT: Frontend displays "Username already taken!" to the user.
            // ALTERNATIVE: Return a custom error DTO with error codes for programmatic handling.
            return ResponseEntity.badRequest().body("Username already taken!");
        }

        // PURPOSE: Creates a new User entity object.
        // IMPACT: This will be persisted to the "users" table in PostgreSQL.
        // ALTERNATIVE: Use a builder pattern: User.builder().username(...).password(...).build() (with Lombok @Builder).
        User user = new User();

        // PURPOSE: Sets the username from the incoming request.
        // IMPACT: Stored in the "username" column (unique, not null).
        // ALTERNATIVE: Validate username format (length, allowed characters) before setting.
        user.setUsername(request.getUsername());

        // PURPOSE: Hashes the plaintext password using BCrypt before storing it.
        // IMPACT: The password is NEVER stored in plaintext. BCrypt adds a random salt automatically.
        //         The resulting hash looks like: $2a$04$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        //         The "$04$" indicates strength=4 (16 rounds) — our optimization for faster logins.
        // ALTERNATIVE: passwordEncoder.encode() with Argon2 for memory-hard hashing (more resistant to GPU attacks).
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // PURPOSE: Persists the new user to the database via JPA.
        // IMPACT: Executes: INSERT INTO users (username, password, wins, losses, draws, xp) VALUES (?, ?, 0, 0, 0, 0)
        //         The returned user object has the auto-generated ID populated.
        // ALTERNATIVE: saveAndFlush() to immediately sync to DB (save() may defer the actual INSERT).
        userRepository.save(user);

        // PURPOSE: Returns HTTP 200 OK with an AuthResponse containing user data.
        // IMPACT: Frontend receives { username, wins, losses, xp, message } and stores it in localStorage.
        //         This effectively "logs in" the user immediately after signup.
        // ALTERNATIVE: Return 201 Created with a Location header pointing to the new user resource (RESTful convention).
        return ResponseEntity.ok(new AuthResponse(user.getId(), user.getUsername(), user.getWins(), user.getLosses(), user.getXp(), "Signup successful!"));
    }

    // PURPOSE: Handles HTTP POST requests to /api/auth/login — authenticates an existing user.
    // IMPACT: Verifies username/password and returns user stats on success, or 401 Unauthorized on failure.
    //         This endpoint was the source of the "slow login" issue due to BCrypt's computational cost.
    // ALTERNATIVE: Use Spring Security's built-in AuthenticationManager with UsernamePasswordAuthenticationToken.
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // PURPOSE: Looks up the user by username in the database.
        // IMPACT: Executes: SELECT * FROM users WHERE username = ?
        //         Returns Optional.empty() if the user doesn't exist.
        // ALTERNATIVE: Use @Query for a custom JPQL query, or userRepository.findByUsernameNative() for raw SQL.
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        // PURPOSE: Checks if a user with the given username was found.
        // IMPACT: If no user found, falls through to the 401 response at the bottom.
        // ALTERNATIVE: userOpt.ifPresentOrElse(user -> {...}, () -> {...}) for more functional style.
        if (userOpt.isPresent()) {
            // PURPOSE: Extracts the User object from the Optional.
            // IMPACT: Provides access to the stored hashed password and user stats.
            User user = userOpt.get();

            // PURPOSE: Compares the plaintext password from the request against the stored BCrypt hash.
            // IMPACT: BCrypt.matches() re-hashes the input with the same salt and rounds, then compares.
            //         This is the MOST CPU-INTENSIVE operation in the login flow.
            //         With strength=4: ~1-3ms. With strength=10 (old): ~100-300ms. With strength=12: ~500ms-1s.
            // ALTERNATIVE: Use AuthenticationManager.authenticate() for Spring Security's built-in flow.
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                // PURPOSE: Returns HTTP 200 OK with the user's data upon successful authentication.
                // IMPACT: Frontend stores this in localStorage and navigates to the main dashboard.
                //         NOTE: No session token or JWT is returned — the app relies on localStorage state.
                //         WARNING: This means auth state is client-side only — not secure for production.
                // ALTERNATIVE: Generate and return a JWT token, which the frontend sends in Authorization headers.
                return ResponseEntity.ok(new AuthResponse(user.getId(), user.getUsername(), user.getWins(), user.getLosses(), user.getXp(), "Login successful!"));
            }
        }

        // PURPOSE: Returns HTTP 401 Unauthorized if username doesn't exist OR password is wrong.
        // IMPACT: Frontend displays "Invalid username or password" error message.
        //         Intentionally vague — doesn't reveal whether the username or password was wrong (security best practice).
        // ALTERNATIVE: Return a JSON error DTO: { "code": "AUTH_FAILED", "message": "..." } for programmatic handling.
        return ResponseEntity.status(401).body("Invalid username or password");
    }
}
