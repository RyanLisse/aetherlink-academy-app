FROM node:24-bookworm-slim@sha256:2fe369e969550cde8e867afc3fe370b260140cab4a23d467074295b42163d553 AS build

WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates git \
  && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@11.19.0

COPY . .
RUN node scripts/setup.mjs

FROM node:24-bookworm-slim@sha256:2fe369e969550cde8e867afc3fe370b260140cab4a23d467074295b42163d553 AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates tini \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build --chown=node:node /app /app
RUN mkdir /data && chown node:node /data

# Unset SOURCE_REVISION stays empty, so /game/health reports revision null.
ARG SOURCE_REVISION
ENV SOURCE_REVISION=$SOURCE_REVISION
LABEL org.opencontainers.image.source="https://github.com/RyanLisse/aetherlink-academy-app" \
      org.opencontainers.image.revision=$SOURCE_REVISION

USER node
ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=4317 \
  ACADEMY_DATA=/data
VOLUME ["/data"]
EXPOSE 4317
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/game/health').then(async r=>{const b=await r.json();process.exit(r.ok&&b.ok?0:1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "scripts/start.mjs"]
