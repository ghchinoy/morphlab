# Stage 1: Build the Lit Frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run lint && npm run build

# Stage 2: Build the Go Backend Server
FROM golang:1.25-bookworm AS backend-builder

WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /morphlab-server .

# Stage 3: Minimal Production Runtime
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app
COPY --from=backend-builder /morphlab-server /app/morphlab-server
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

ENV PORT=8080
ENV GEMINI_MODEL=gemini-4-argon
EXPOSE 8080

ENTRYPOINT ["/app/morphlab-server"]
