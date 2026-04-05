// PURPOSE: This file is the main entry point for the entire Spring Boot backend server.
// IMPACT: Without this file, the backend cannot start. It bootstraps Spring's IoC container,
//         auto-configures DataSource, JPA, Security, WebSocket, and all beans.
// ALTERNATIVE: Could use SpringApplicationBuilder for more advanced startup (profiles, banners, etc.)
//              or deploy as a WAR file inside an external Tomcat server.
package com.chess; // Declares the root package. Spring Boot scans this package and all sub-packages for components.
                   // IMPACT: All @Controller, @Service, @Repository, @Configuration classes under com.chess.* are auto-detected.
                   // ALTERNATIVE: Use @ComponentScan(basePackages="...") to explicitly define scan paths.

// PURPOSE: Imports the SpringApplication class which provides the static run() method to launch the app.
// IMPACT: This is the core Spring Boot launcher — without it, no embedded server starts.
// ALTERNATIVE: Could use new SpringApplicationBuilder(ChessApplication.class).run(args) for fluent config.
import org.springframework.boot.SpringApplication;

// PURPOSE: Imports the @SpringBootApplication meta-annotation (combines @Configuration + @EnableAutoConfiguration + @ComponentScan).
// IMPACT: Enables auto-configuration of Spring beans based on classpath dependencies (JPA, Security, WebSocket, etc.).
// ALTERNATIVE: Manually declare @Configuration, @EnableAutoConfiguration, @ComponentScan separately for fine-grained control.
import org.springframework.boot.autoconfigure.SpringBootApplication;

// PURPOSE: Marks this class as the Spring Boot application entry point.
// IMPACT: Triggers component scanning from this package downward, enables auto-configuration.
//         Spring will auto-detect: SecurityConfig, WebSocketConfig, all Controllers, Services, Repositories.
// ALTERNATIVE: @SpringBootApplication(exclude = {...}) to disable specific auto-configs (e.g., SecurityAutoConfiguration).
@SpringBootApplication
public class ChessApplication { // The main application class. Convention: named after the project.
                                 // IMPACT: Must be in the root package (com.chess) so @ComponentScan finds all sub-packages.
                                 // ALTERNATIVE: Any class name works, but convention is <ProjectName>Application.

    // PURPOSE: Standard Java entry point. JVM calls this method when the JAR is executed.
    // IMPACT: Without main(), the application cannot start from command line or Docker.
    // ALTERNATIVE: For testing, use @SpringBootTest which starts the context without main().
    public static void main(String[] args) {

        // PURPOSE: Bootstraps the Spring ApplicationContext, starts the embedded Tomcat server on port 8080,
        //          initializes all beans (DB connections, security filters, WebSocket endpoints, etc.).
        // IMPACT: This single call starts the ENTIRE backend — Tomcat, Hibernate, HikariCP, Spring Security, STOMP broker.
        // ALTERNATIVE: SpringApplication app = new SpringApplication(ChessApplication.class);
        //              app.setDefaultProperties(...); app.run(args); — for custom startup properties.
        SpringApplication.run(ChessApplication.class, args);
    }
}
