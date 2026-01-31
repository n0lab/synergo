# ===== Build stage =====
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Outils nécessaires aux modules natifs (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# IMPORTANT: force la compilation depuis les sources
ENV npm_config_build_from_source=better-sqlite3

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ===== Runtime stage =====
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build /app /app

RUN mkdir -p /app/public/resources /app/server/data

EXPOSE 3001
CMD ["npm", "start"]
