FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates git && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@11.19.0
COPY . .
RUN pnpm install --frozen-lockfile \
  && pnpm --filter @academy/i18n --filter @academy/server --filter @academy/web run typecheck \
  && pnpm --filter @academy/server --filter @academy/web run build

FROM node:24-bookworm-slim AS runtime
ARG SOURCE_REVISION=unknown
ENV SOURCE_REVISION=$SOURCE_REVISION
LABEL org.opencontainers.image.source="https://github.com/RyanLisse/aetherlink-academy-app" \
      org.opencontainers.image.revision=$SOURCE_REVISION \
      org.opencontainers.image.title="aetherlink-academy-wave"
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates tini && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build --chown=node:node /app /app
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4318 ACADEMY_WEB_DIST=/app/apps/web/dist
EXPOSE 4318
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(async r=>{const b=await r.json();process.exit(r.ok&&b.ok?0:1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "apps/server/dist/main.js"]
