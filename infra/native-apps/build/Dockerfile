# The generated standalone scaffold is the build context. It contains
# published @agent-native packages with exact versions in its lockfile, so a
# full BuilderIO monorepo is not needed for this image.
ARG NODE_IMAGE=node:24-bookworm-slim@sha256:2fe369e969550cde8e867afc3fe370b260140cab4a23d467074295b42163d553

FROM ${NODE_IMAGE} AS build

ARG SOURCE_REVISION=unknown
ARG UPSTREAM_CORE_REVISION=adec853eb337cbe0ead48464305d6f30cc07806e

WORKDIR /app

# Chat's node-pty has no Linux prebuild and runs node-gyp during install.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates g++ git make python3 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# The standalone package pins pnpm 10.29.1. Frozen install is required so the
# generated lockfile, not a registry resolver, defines the dependency graph.
RUN corepack install \
  && corepack pnpm install --frozen-lockfile

COPY . .
# The patch is the same narrowly scoped Better Auth signup workaround already
# verified by the live Slides PoC. It is applied to the upload context, not the
# upstream scaffold checkout.
COPY chat-auth.patch /tmp/chat-auth.patch
RUN if grep -q 'academy-disable-signup-auto-session' server/plugins/auth.ts 2>/dev/null; then \
      echo 'Better Auth signup patch already present'; \
    else \
      git apply --unidiff-zero /tmp/chat-auth.patch; \
    fi \
  && corepack pnpm build \
  && test -f .output/server/index.mjs \
  && corepack pnpm prune --prod

FROM ${NODE_IMAGE} AS runtime

ARG SOURCE_REVISION=unknown
ARG UPSTREAM_CORE_REVISION=adec853eb337cbe0ead48464305d6f30cc07806e

LABEL org.opencontainers.image.title="Academy Chat" \
  org.opencontainers.image.revision="$SOURCE_REVISION" \
  org.opencontainers.image.base.revision="$UPSTREAM_CORE_REVISION" \
  org.opencontainers.image.source="https://github.com/BuilderIO/agent-native"

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates tini \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data \
  && chown node:node /data

WORKDIR /app

COPY --from=build --chown=node:node /app/.output /app/.output
COPY --from=build --chown=node:node /app/node_modules /app/node_modules
COPY --from=build --chown=node:node /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
# Chat's release migration imports only published core JavaScript. Node 24's
# native type stripping runs this checked-in TypeScript entrypoint without
# shipping dev-only tsx or rewriting .js specifiers.
COPY --from=build --chown=node:node /app/scripts/migrate-production.ts /app/scripts/migrate-production.ts

ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=3000

USER node
VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+process.env.PORT+'/_agent-native/ping').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", ".output/server/index.mjs"]
