# Masar: one container that builds and runs the app (used by render.yaml).
# State (.data/state.json and uploads) lives in /data: mount a persistent
# volume there, or every restart starts from the synthetic defaults.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    MASAR_DATA_DIR=/data
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 3000
# next start listens on $PORT (Render sets it; 3000 otherwise) on all interfaces.
CMD ["npx", "next", "start"]
