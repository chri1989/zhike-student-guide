FROM node:24-bookworm-slim AS build
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=7860 GUIDE_DATA_DIR=/data
WORKDIR /app
COPY --from=build /app/.next/standalone ./.next/standalone
COPY --from=build /app/.next/static ./.next/standalone/.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/public ./.next/standalone/public
COPY --from=build /app/scripts/start.mjs /app/scripts/initialize-store.mjs /app/scripts/restore-store.mjs ./scripts/
COPY --from=build /app/data/seed.json ./data/seed.json
COPY --from=build /app/drizzle ./drizzle
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 7860
CMD ["node","scripts/start.mjs"]
