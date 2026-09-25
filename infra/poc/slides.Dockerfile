# syntax=docker/dockerfile:1.7

# Build with the scaffold as the context and this file as -f.  The companion
# slides.dockerignore is used by the documented filtered-context command
# because the scaffold's own .dockerignore omits server/ and types/.
ARG NODE_IMAGE=node:24-bookworm-slim@sha256:2fe369e969550cde8e867afc3fe370b260140cab4a23d467074295b42163d553

FROM ${NODE_IMAGE} AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates g++ git make python3 \
  && rm -rf /var/lib/apt/lists/*

# Install before copying source so dependency layers remain cacheable.  The
# lockfile is required: floating or lockfile-less installs are not supported.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# package.json pins pnpm 10.14.0 and Corepack's package-manager integrity hash.
# Corepack validates and activates that exact package-manager artifact.
RUN corepack install && corepack pnpm install --frozen-lockfile

COPY . .
# Nitro externalizes dependencies; prune dev tooling only after building.
RUN corepack pnpm build && corepack pnpm prune --prod

FROM ${NODE_IMAGE} AS runtime

ARG SOURCE_REVISION=unknown
ARG UPSTREAM_CORE_REVISION=adec853eb337cbe0ead48464305d6f30cc07806e

LABEL org.opencontainers.image.title="Academy Slides" \
  org.opencontainers.image.revision="$SOURCE_REVISION" \
  org.opencontainers.image.base.revision="$UPSTREAM_CORE_REVISION"

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates tini \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data \
  && chown node:node /data

WORKDIR /app

COPY --from=build --chown=node:node /app/.output /app/.output
COPY --from=build --chown=node:node /app/node_modules /app/node_modules
COPY --from=build --chown=node:node /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=3000

USER node
VOLUME ["/data"]
EXPOSE 3000

# The framework's ping endpoint is unauthenticated and does not require a
# configured external provider.  DATABASE_URL is supplied at runtime.
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+process.env.PORT+'/_agent-native/ping').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", ".output/server/index.mjs"]
