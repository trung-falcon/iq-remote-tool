# syntax=docker/dockerfile:1

# ---- Stage 1: build the web UI (needs dev deps: vite, plugin-react) ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY tsconfig.json ./
COPY shared ./shared
COPY web ./web
RUN yarn build

# ---- Stage 2: runtime — one server that serves /api + the built UI ----
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4000
WORKDIR /app

# Only production deps (incl. tsx, which runs the TS server directly).
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile && yarn cache clean

COPY tsconfig.json ./
COPY shared ./shared
COPY server ./server
COPY --from=builder /app/web/dist ./web/dist

EXPOSE 4000
# service-account.json is mounted at runtime (a secret — never baked into the image).
CMD ["yarn", "start"]
