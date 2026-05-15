ARG JAVA_VERSION=25
FROM maven:3.9.9-eclipse-temurin-${JAVA_VERSION} AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

ARG JAVA_VERSION=25
FROM eclipse-temurin:${JAVA_VERSION}-jre
WORKDIR /app
COPY --from=build /app/target/jdbc-service-1.0.0.jar app.jar
EXPOSE 3002
CMD ["java", "-jar", "app.jar"]
