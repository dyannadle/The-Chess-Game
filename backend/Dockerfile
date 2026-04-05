# PURPOSE: Multi-stage Dockerfile for building and running the Spring Boot backend in a container.
# IMPACT: Used by Docker (and Render/Railway cloud platforms) to containerize the backend.
#         Multi-stage build keeps the final image small — only includes the JAR, not Maven/source code.
# ALTERNATIVE: Use a Buildpack (Spring Boot Native Image), or deploy as a plain JAR without Docker.

# ========================= STAGE 1: BUILD =========================

# PURPOSE: Uses the Maven 3.8.5 + OpenJDK 17 image as the build environment.
# IMPACT: Provides Maven and Java 17 for compiling the Spring Boot application.
#         "AS build" names this stage so the second stage can reference it with COPY --from=build.
# ALTERNATIVE: Use eclipse-temurin:17-jdk with manually installed Maven.
#              Use gradle:8-jdk17 for Gradle-based projects.
FROM maven:3.8.5-openjdk-17 AS build

# PURPOSE: Sets the working directory inside the container to /app.
# IMPACT: All subsequent commands (COPY, RUN) execute relative to /app.
WORKDIR /app

# PURPOSE: Copies ALL files from the build context (backend/ directory) into /app in the container.
# IMPACT: Includes pom.xml, src/, and any other files. The Docker context is the backend/ directory.
# ALTERNATIVE: Use a .dockerignore file to exclude unnecessary files (node_modules, target/, .git/).
#              Copy pom.xml first, then run mvn dependency:go-offline, then copy src/ (for better layer caching).
COPY . .

# PURPOSE: Runs Maven to build the Spring Boot JAR file, skipping tests for faster builds.
# IMPACT: Compiles Java sources, downloads dependencies, packages everything into a fat JAR.
#         The output JAR is at: /app/target/chess-backend-0.0.1-SNAPSHOT.jar
#         -DskipTests skips unit/integration tests to speed up the Docker build.
# ALTERNATIVE: Remove -DskipTests to run tests during build (recommended for CI/CD pipelines).
RUN mvn clean package -DskipTests

# ========================= STAGE 2: RUN =========================

# PURPOSE: Uses Eclipse Temurin JDK 17 on Ubuntu Jammy as the runtime image.
# IMPACT: A smaller, production-ready JDK image (~300MB vs ~700MB for Maven image).
#         "jammy" = Ubuntu 22.04 LTS base (stable, well-supported).
# ALTERNATIVE: eclipse-temurin:17-jre-jammy — even smaller, uses JRE instead of JDK (can't debug remotely).
#              gcr.io/distroless/java17 — minimal image with no shell (most secure but harder to debug).
FROM eclipse-temurin:17-jdk-jammy

# PURPOSE: Sets the working directory for the runtime container.
WORKDIR /app

# PURPOSE: Copies ONLY the built JAR from the build stage into the runtime image.
# IMPACT: The final image contains just the JAR + JDK, not Maven, source code, or build artifacts.
#         This multi-stage approach reduces the final image size from ~700MB to ~300MB.
# ALTERNATIVE: Use a volume mount for the JAR instead of COPY (not recommended for production).
COPY --from=build /app/target/chess-backend-0.0.1-SNAPSHOT.jar app.jar

# PURPOSE: Declares that the container listens on port 8080.
# IMPACT: Documentation for users/orchestrators — doesn't actually open the port.
#         Docker users still need -p 8080:8080. Cloud platforms auto-detect this.
# ALTERNATIVE: EXPOSE ${PORT} — but Dockerfile doesn't support variable substitution in EXPOSE.
EXPOSE 8080

# PURPOSE: Defines the command that runs when the container starts.
# IMPACT: Runs the Spring Boot JAR with: max 512MB heap, on the port specified by PORT env var (default 8080).
#         -Xmx512m limits heap memory — important for free-tier platforms with limited RAM (512MB-1GB).
#         --server.port=${PORT:-8080} uses the platform-provided PORT env var (e.g., Render sets this).
#         "sh -c" wraps the command to enable shell variable expansion ($PORT).
# ALTERNATIVE: ENTRYPOINT ["java", "-Xmx512m", "-jar", "app.jar"] — simpler but can't use shell variables.
#              Add -XX:+UseG1GC for better garbage collection in constrained environments.
#              Add --spring.profiles.active=prod for production-specific configuration.
ENTRYPOINT ["sh", "-c", "java -Xmx512m -jar app.jar --server.port=${PORT:-8080}"]
