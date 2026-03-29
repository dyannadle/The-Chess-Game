# Step 1: Build the app using Maven
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Step 2: Run the app using a slim OpenJDK image
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/chess-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
