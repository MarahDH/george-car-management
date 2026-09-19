# React SPA — build with Node, serve static with Caddy (Railway)
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_API_URL is baked into the bundle at build time. Railway passes the
# service variable of the same name in as a build arg (declared below), so set
# VITE_API_URL in the React service to the full Laravel API URL, e.g.
#   https://laravel-api-production.up.railway.app/api
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Serve stage ---
FROM caddy:2-alpine
COPY --from=build /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
