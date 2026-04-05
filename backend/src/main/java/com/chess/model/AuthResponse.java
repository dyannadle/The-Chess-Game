// PURPOSE: DTO (Data Transfer Object) for outgoing authentication responses (login/signup success).
// IMPACT: Serialized to JSON and sent back to the frontend after successful authentication.
//         The frontend stores this in localStorage as the "current user" session.
// ALTERNATIVE: Use a JWT token response { "token": "..." } for stateless authentication.
//              Or include the full User entity (but that exposes the password hash — SECURITY RISK).
package com.chess.model;

// PURPOSE: Lombok's @AllArgsConstructor generates AuthResponse(String, int, int, int, String).
// IMPACT: Used in AuthController: new AuthResponse(user.getUsername(), user.getWins(), user.getLosses(), user.getXp(), "Login successful!")
import lombok.AllArgsConstructor;

// PURPOSE: Lombok's @Data generates getters, setters, toString, equals, hashCode.
// IMPACT: Jackson uses getUsername(), getWins(), etc. to serialize this object to JSON.
import lombok.Data;

// PURPOSE: Lombok's @NoArgsConstructor generates a no-arg constructor.
// IMPACT: Needed by Jackson for deserialization (though this DTO is mainly serialized, not deserialized).
import lombok.NoArgsConstructor;

// PURPOSE: @Data generates all getters/setters and utility methods.
@Data

// PURPOSE: Constructor with all fields for convenient creation in AuthController.
@AllArgsConstructor

// PURPOSE: No-arg constructor for Jackson compatibility.
@NoArgsConstructor
public class AuthResponse { // The JSON response sent to the frontend after login/signup.
                            // IMPACT: Frontend parses this to populate the user state and localStorage.

    // PURPOSE: The authenticated user's database ID.
    // IMPACT: Allows the frontend to make API calls that require the user's ID
    //         like fetching match history.
    private Long id;

    // PURPOSE: The authenticated user's username.
    // IMPACT: Displayed in the sidebar, chat messages, and user profile section of the frontend.
    // ALTERNATIVE: Include userId as well for API calls that need the numeric ID.
    //              NOTE: Currently, the frontend doesn't receive the user's database ID — this is a known gap.
    //              The frontend cannot call /api/matches/user/{userId} because it doesn't know the ID.
    private String username;

    // PURPOSE: The user's total number of wins.
    // IMPACT: Could be displayed in a stats dashboard (currently shown in the welcome message context).
    private int wins;

    // PURPOSE: The user's total number of losses.
    // IMPACT: Part of the player's performance statistics.
    private int losses;

    // PURPOSE: The user's experience points.
    // IMPACT: Gamification metric — could drive ranking or progression features.
    //         NOTE: Currently never incremented in the codebase (placeholder for future use).
    private int xp;

    // PURPOSE: A human-readable message describing the auth result (e.g., "Login successful!", "Signup successful!").
    // IMPACT: Could be displayed as a toast/notification in the frontend UI.
    private String message;
}
