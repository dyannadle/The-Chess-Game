// PURPOSE: DTO (Data Transfer Object) for incoming login/signup JSON request bodies.
// IMPACT: Deserializes the JSON { "username": "...", "password": "..." } sent by the frontend Auth component.
//         Used by AuthController's login() and signup() methods via @RequestBody.
// ALTERNATIVE: Use a Java Record (Java 16+): record LoginRequest(String username, String password) {}
//              Or use Map<String, String> for untyped access (less type-safe).
package com.chess.model;

// PURPOSE: Lombok's @AllArgsConstructor generates LoginRequest(String username, String password).
import lombok.AllArgsConstructor;

// PURPOSE: Lombok's @Data generates getters, setters, toString, equals, hashCode.
// IMPACT: getUsername() and getPassword() are used by AuthController to extract credentials.
import lombok.Data;

// PURPOSE: Lombok's @NoArgsConstructor generates a no-arg constructor.
// IMPACT: REQUIRED by Jackson (JSON deserializer) — it needs a no-arg constructor to instantiate the object
//         before calling setters to populate fields from JSON.
// ALTERNATIVE: Use @JsonCreator on a constructor for constructor-based deserialization.
import lombok.NoArgsConstructor;

// PURPOSE: @Data generates getters/setters for both fields.
// IMPACT: Jackson uses setUsername() and setPassword() during JSON deserialization.
//         AuthController uses getUsername() and getPassword() to read the credentials.
@Data

// PURPOSE: Constructor with all fields: LoginRequest("alice", "password123").
@AllArgsConstructor

// PURPOSE: No-arg constructor: LoginRequest() — required by Jackson for JSON → Object conversion.
@NoArgsConstructor
public class LoginRequest { // Represents the HTTP request body for /api/auth/login and /api/auth/signup.
                            // IMPACT: This is a "throw-away" DTO — not persisted to the database.

    // PURPOSE: The username submitted by the user in the login/signup form.
    // IMPACT: Used for database lookup (login) or creating a new User entity (signup).
    // ALTERNATIVE: Add @NotBlank validation annotation to enforce non-empty values server-side.
    private String username;

    // PURPOSE: The plaintext password submitted by the user.
    // IMPACT: Compared against the stored BCrypt hash (login) or hashed before storage (signup).
    //         WARNING: This field carries the plaintext password — ensure HTTPS in production to prevent interception.
    // ALTERNATIVE: Add @Size(min = 8) for minimum password length validation.
    private String password;
}
