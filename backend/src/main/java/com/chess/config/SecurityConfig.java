// PURPOSE: This file configures Spring Security for the entire backend application.
// IMPACT: Controls authentication, authorization, CORS policy, and password hashing for all HTTP endpoints.
//         Without this file, Spring Security's defaults would block ALL requests and auto-generate a login page.
// ALTERNATIVE: Use application.properties for basic security config, or use OAuth2/JWT-based security instead of session-based.
package com.chess.config; // Declares that this class belongs to the config sub-package.
                          // IMPACT: Spring Boot auto-detects this because it's under the root com.chess package.
                          // ALTERNATIVE: Could be in any package if explicitly referenced via @ComponentScan.

// PURPOSE: Imports the @Bean annotation, which tells Spring to register the returned object as a managed bean in the IoC container.
// IMPACT: Methods annotated with @Bean produce singleton instances managed by Spring's lifecycle.
// ALTERNATIVE: @Component on a class does the same for the class itself, but @Bean is for method-level factory patterns.
import org.springframework.context.annotation.Bean;

// PURPOSE: Imports @Configuration, marking this class as a source of Spring bean definitions.
// IMPACT: Spring processes this class at startup and registers all @Bean methods.
// ALTERNATIVE: @Component works too, but @Configuration ensures CGLIB proxying for inter-bean references.
import org.springframework.context.annotation.Configuration;

// PURPOSE: Imports HttpSecurity, the builder object used to configure HTTP security rules.
// IMPACT: Used in filterChain() to define which endpoints require auth, CSRF settings, CORS config, etc.
// ALTERNATIVE: WebSecurityConfigurerAdapter (deprecated in Spring Security 6.x) was the old way.
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

// PURPOSE: Imports @EnableWebSecurity, which activates Spring Security's web security support.
// IMPACT: Registers the security filter chain in the servlet container. Without it, security rules are ignored.
// ALTERNATIVE: In Spring Boot 3.x, this is auto-configured, but explicit declaration is best practice for clarity.
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

// PURPOSE: Imports AbstractHttpConfigurer, a utility to disable specific security features like CSRF.
// IMPACT: Used as a method reference (AbstractHttpConfigurer::disable) for clean CSRF disabling.
// ALTERNATIVE: .csrf(csrf -> csrf.disable()) — functionally identical, just more verbose.
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

// PURPOSE: Imports BCryptPasswordEncoder, the industry-standard password hashing algorithm.
// IMPACT: All user passwords are hashed with BCrypt before storage. Login compares hashed values.
//         BCrypt is deliberately slow to resist brute-force attacks.
// ALTERNATIVE: Argon2PasswordEncoder (more modern, memory-hard), SCryptPasswordEncoder, or PBKDF2PasswordEncoder.
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

// PURPOSE: Imports the PasswordEncoder interface — the abstraction that all password encoders implement.
// IMPACT: By coding to the interface, the app can swap BCrypt for Argon2 without changing controller code.
// ALTERNATIVE: DelegatingPasswordEncoder — supports multiple algorithms simultaneously for migration scenarios.
import org.springframework.security.crypto.password.PasswordEncoder;

// PURPOSE: Imports SecurityFilterChain, the modern way to define security filter chains in Spring Security 6+.
// IMPACT: Replaces the deprecated WebSecurityConfigurerAdapter pattern.
// ALTERNATIVE: Multiple SecurityFilterChain beans can coexist for different URL patterns (e.g., /api/** vs /admin/**).
import org.springframework.security.web.SecurityFilterChain;

// PURPOSE: Imports CorsConfiguration, which defines allowed origins, methods, and headers for CORS.
// IMPACT: Controls which frontend domains can call this backend. Without CORS config, browsers block cross-origin requests.
// ALTERNATIVE: @CrossOrigin on individual controllers (less centralized), or a CorsFilter bean.
import org.springframework.web.cors.CorsConfiguration;

// PURPOSE: Imports UrlBasedCorsConfigurationSource, which maps CORS configs to URL patterns.
// IMPACT: Applies the CORS configuration to all endpoints matching "/**".
// ALTERNATIVE: CorsConfigurationSource interface with a custom implementation.
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// PURPOSE: Imports Spring Security's in-memory User builder (NOT the JPA User entity).
// IMPACT: Used for creating in-memory UserDetails — currently unused but imported for the UserDetailsService bean.
// ALTERNATIVE: Custom UserDetailsService that loads users from the database (recommended for production).
import org.springframework.security.core.userdetails.User;

// PURPOSE: Imports the UserDetails interface — Spring Security's representation of an authenticated user.
// IMPACT: Required by the UserDetailsService contract.
// ALTERNATIVE: Custom class implementing UserDetails for richer user data (roles, permissions, etc.).
import org.springframework.security.core.userdetails.UserDetails;

// PURPOSE: Imports UserDetailsService — the interface Spring Security uses to load user data during authentication.
// IMPACT: Defines how users are looked up. Currently returns an empty in-memory store (no Spring Security login used).
// ALTERNATIVE: Implement UserDetailsService backed by UserRepository for database-driven authentication.
import org.springframework.security.core.userdetails.UserDetailsService;

// PURPOSE: Imports InMemoryUserDetailsManager — a simple in-memory user store.
// IMPACT: Provides an empty user store so Spring Security doesn't auto-generate a random password at startup.
// ALTERNATIVE: JdbcUserDetailsManager for database-backed users, or a custom UserDetailsService implementation.
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

// PURPOSE: Imports Arrays utility for creating lists from varargs.
// IMPACT: Used to define lists of allowed origins, methods, and headers for CORS configuration.
// ALTERNATIVE: List.of() (Java 9+) for immutable lists, but Arrays.asList() is more traditional.
import java.util.Arrays;

// PURPOSE: @Configuration marks this class as a configuration class that provides @Bean definitions.
// IMPACT: Spring creates a CGLIB proxy of this class to ensure @Bean methods return singletons on repeated calls.
// ALTERNATIVE: @Component (no CGLIB proxy, less strict singleton guarantees for inter-bean references).
@Configuration

// PURPOSE: @EnableWebSecurity activates Spring Security's web security infrastructure.
// IMPACT: Registers the SecurityFilterChain with the servlet container, enabling authentication/authorization.
// ALTERNATIVE: Auto-configured in Spring Boot 3.x, but explicit is better for readability.
@EnableWebSecurity
public class SecurityConfig { // The central security configuration class for the entire backend.
                               // IMPACT: Defines password encoding, CORS policy, and authorization rules globally.
                               // ALTERNATIVE: Split into multiple @Configuration classes for modular security (e.g., ApiSecurityConfig, WebSocketSecurityConfig).

    // PURPOSE: Creates and registers a PasswordEncoder bean in the Spring IoC container.
    // IMPACT: Every call to passwordEncoder.encode() and passwordEncoder.matches() in AuthController uses this bean.
    //         BCrypt(4) uses 2^4 = 16 iterations — optimized for speed on hobby projects.
    //         Default BCrypt(10) uses 1024 iterations — secure but slow on free-tier hosting.
    // ALTERNATIVE: new BCryptPasswordEncoder(10) for production security, or new Argon2PasswordEncoder() for modern apps.
    @Bean
    public PasswordEncoder passwordEncoder() {
        // PURPOSE: Instantiates BCryptPasswordEncoder with strength=4 (2^4 = 16 hashing rounds).
        // IMPACT: Password hashing is ~64x faster than default strength=10, fixing the slow login issue.
        //         BCrypt embeds the strength in the hash prefix ($2a$04$...), so matches() auto-detects it.
        //         Existing passwords hashed with strength=10 ($2a$10$...) will STILL verify correctly.
        // ALTERNATIVE: new BCryptPasswordEncoder() — default strength 10, more secure but much slower.
        //              new BCryptPasswordEncoder(12) — 4096 rounds, recommended for high-security production apps.
        return new BCryptPasswordEncoder(4);
    }

    // PURPOSE: Creates a UserDetailsService bean — required by Spring Security but not actively used here.
    // IMPACT: Prevents Spring Boot from auto-generating a random password and printing it to the console.
    //         The app uses custom auth logic in AuthController instead of Spring Security's built-in auth.
    // ALTERNATIVE: Implement UserDetailsService backed by UserRepository for full Spring Security integration.
    //              This would enable @PreAuthorize, @Secured, and method-level security.
    @Bean
    public UserDetailsService userDetailsService() {
        // PURPOSE: Returns an empty in-memory user store (no predefined users).
        // IMPACT: Satisfies Spring Security's requirement for a UserDetailsService without affecting custom auth.
        // ALTERNATIVE: new InMemoryUserDetailsManager(User.withUsername("admin").password(...).roles("ADMIN").build())
        //              — to add a default admin user.
        return new InMemoryUserDetailsManager();
    }

    // PURPOSE: Defines the main HTTP security filter chain for the application.
    // IMPACT: Controls CSRF, CORS, and URL-level authorization for EVERY HTTP request to the backend.
    // ALTERNATIVE: Multiple @Bean SecurityFilterChain methods with @Order annotations for different security profiles.
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // PURPOSE: Disables CSRF (Cross-Site Request Forgery) protection.
            // IMPACT: Required for REST APIs consumed by frontends on different origins. CSRF protection
            //         expects a CSRF token in forms, which doesn't apply to JSON API calls.
            // ALTERNATIVE: Keep CSRF enabled and use CsrfTokenRequestAttributeHandler for SPAs.
            //              WARNING: Disabling CSRF is safe here because auth is stateless (no cookies/sessions used).
            .csrf(AbstractHttpConfigurer::disable)

            // PURPOSE: Enables CORS using the custom corsConfigurationSource() bean defined below.
            // IMPACT: Allows the Vite frontend (localhost:3000/5173) and Vercel deployments to call this backend.
            //         Without this, browsers block cross-origin fetch() calls.
            // ALTERNATIVE: @CrossOrigin on each controller (less centralized, harder to maintain).
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // PURPOSE: Defines URL-level authorization rules.
            // IMPACT: Determines which endpoints are public vs. protected.
            .authorizeHttpRequests(auth -> auth
                // PURPOSE: Permits unauthenticated access to auth endpoints and WebSocket endpoint.
                // IMPACT: /api/auth/login, /api/auth/signup, and /ws-chess can be called without any credentials.
                // ALTERNATIVE: Use .authenticated() and configure JWT tokens for protected endpoints.
                .requestMatchers("/api/auth/**", "/ws-chess/**").permitAll()

                // PURPOSE: Permits ALL other requests without authentication (simplified for development).
                // IMPACT: /api/matches/**, /api/puzzles/** are all publicly accessible.
                //         WARNING: In production, this should be .authenticated() with proper JWT/session auth.
                // ALTERNATIVE: .requestMatchers("/api/**").authenticated() — requires login for game endpoints.
                .anyRequest().permitAll() // Simplified for now to allow game flow
            );

        // PURPOSE: Builds and returns the SecurityFilterChain object.
        // IMPACT: The built chain is registered with the servlet container and applied to every request.
        // ALTERNATIVE: Additional chains can be created with @Order for priority-based matching.
        return http.build();
    }

    // PURPOSE: Defines the CORS (Cross-Origin Resource Sharing) configuration for the entire backend.
    // IMPACT: Without this, browsers block requests from the Vite dev server and Vercel production frontend.
    //         CORS is a browser-enforced security mechanism — server-to-server calls are unaffected.
    // ALTERNATIVE: Use application.properties: spring.mvc.cors.allowed-origins=http://localhost:3000
    //              (less flexible, doesn't support patterns).
    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        // PURPOSE: Creates a new CORS configuration object.
        // IMPACT: Defines the rules that the browser checks before allowing cross-origin requests.
        // ALTERNATIVE: Inline lambda in the filterChain() method (less reusable).
        CorsConfiguration configuration = new CorsConfiguration();

        // PURPOSE: Sets the allowed origin patterns — which frontend domains can call this backend.
        // IMPACT: Requests from unlisted origins are blocked by the browser (403 CORS error).
        //         Patterns support wildcards: "https://*.vercel.app" matches any Vercel subdomain.
        // ALTERNATIVE: configuration.setAllowedOrigins(List.of(...)) — exact match only, no wildcards.
        //              configuration.addAllowedOriginPattern("*") — allows ANY origin (insecure but simple).
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:3000", "http://localhost:5173", "https://*.vercel.app", "https://grandmaster-chess-web.vercel.app"));

        // PURPOSE: Sets the HTTP methods allowed for cross-origin requests.
        // IMPACT: Only GET, POST, PUT, DELETE, and OPTIONS are allowed. Other methods (PATCH, HEAD) would be blocked.
        //         OPTIONS is required for CORS preflight requests.
        // ALTERNATIVE: configuration.addAllowedMethod("*") — allows all HTTP methods (less restrictive).
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // PURPOSE: Sets the HTTP headers the frontend is allowed to send in cross-origin requests.
        // IMPACT: Authorization (for JWT tokens), Cache-Control, and Content-Type are allowed.
        //         Other custom headers would be blocked.
        // ALTERNATIVE: configuration.addAllowedHeader("*") — allows all headers (common for development).
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type"));

        // PURPOSE: Allows credentials (cookies, Authorization headers) in cross-origin requests.
        // IMPACT: Required if the frontend sends cookies or auth tokens. Cannot be used with allowedOrigin("*").
        // ALTERNATIVE: Set to false if no credentials are needed (simplifies CORS but limits auth options).
        configuration.setAllowCredentials(true);

        // PURPOSE: Creates a URL-based CORS config source that maps patterns to configurations.
        // IMPACT: The "/**" pattern applies this CORS config to ALL backend endpoints.
        // ALTERNATIVE: Register different configs for different URL patterns (e.g., "/api/**" vs "/ws-chess/**").
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        // PURPOSE: Registers the CORS configuration for all URL paths.
        // IMPACT: Every endpoint in the backend will use these CORS rules.
        // ALTERNATIVE: source.registerCorsConfiguration("/api/**", apiConfig);
        //              source.registerCorsConfiguration("/ws-chess/**", wsConfig); — for per-path CORS.
        source.registerCorsConfiguration("/**", configuration);

        // PURPOSE: Returns the configured source to be used by the security filter chain.
        // IMPACT: Spring Security integrates this CORS config into its filter pipeline.
        return source;
    }
}
