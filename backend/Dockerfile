# ==============================
# ETAPA 1: Build do Frontend (React + Vite)
# ==============================
FROM node:18 AS frontend

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build


# ==============================
# ETAPA 2: Build do Backend (Spring Boot com Java 21)
# ==============================
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

COPY backend/pom.xml .
COPY backend/src ./src

# Copia o build do frontend para dentro do backend
RUN rm -rf src/main/resources/static/* && mkdir -p src/main/resources/static
COPY --from=frontend /app/frontend/dist ./src/main/resources/static

# Compila o projeto (gera o .jar)
RUN mvn clean package -DskipTests


# ==============================
# ETAPA 3: Runtime (JDK 21 leve)
# ==============================
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar
ENV SERVER_PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]