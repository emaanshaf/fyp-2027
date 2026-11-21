# Container image for the Qitab-e-Noor API.
#
# Build context is this directory (backend/), not the repo root — the API has its own
# package.json and shares nothing with the Expo app:
#
#   docker build -t qitabe-noor-api ./backend
#   docker run --rm -p 3001:3001 \
#     -e NODE_ENV=production \
#     -e DATABASE_URL=postgresql://... \
#     -e JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))") \
#     -e CORS_ORIGIN=https://qitabe-noor.app \
#     -e ANTHROPIC_API_KEY=sk-ant-... \
#     qitabe-noor-api
#
# Run the schema migration once against a new database before the first boot:
#   docker run --rm -e DATABASE_URL=postgresql://... qitabe-noor-api npm run migrate
#
# Nothing is baked into the image: every secret arrives as an environment
# variable at run time, so the image itself is safe to push to a registry.

# Node 20 matches the version the EAS build profiles and CI pin.
FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

# Copied on their own so the dependency layer is only rebuilt when the
# manifests change, not on every source edit.
COPY package.json package-lock.json ./

# `npm ci` needs the lockfile to match package.json exactly and installs
# nothing else — no postinstall surprises from a stale node_modules.
# --omit=dev leaves out anything only used for local development.
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# The base image ships an unprivileged `node` user. Running as root would let
# a request that achieves code execution write anywhere in the container.
# .data is the development file store; it is created and owned here so the
# server can start in a non-production container without a permission error.
RUN mkdir -p /app/.data && chown -R node:node /app
USER node

# Documentation only — the server binds process.env.PORT, which every hosting
# platform sets itself. Publish with -p or let the platform map it.
EXPOSE 3001

# The server refuses to listen until it has a database, so a container that
# cannot reach Postgres reports unhealthy rather than serving broken requests.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const p=process.env.PORT||3001;require('http').get('http://127.0.0.1:'+p+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Exec form, so node runs as PID 1 and receives SIGTERM directly — server.js
# installs its own handler and closes the listener cleanly.
CMD ["node", "server.js"]
