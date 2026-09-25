# Fast PoC overlay on the already-built Academy revision on the target host.
# Verify the base image ID against deployment evidence before building.
FROM sha256:b80cdb10b303cb41c43102785db118b17165fa89e8a22d36e5eefd0390cb804e
ARG SOURCE_REVISION
RUN test -n "$SOURCE_REVISION" && test "$SOURCE_REVISION" != "poc" && test "$SOURCE_REVISION" != "unknown"
ENV SOURCE_REVISION=$SOURCE_REVISION
LABEL org.opencontainers.image.title="academy-authoring-poc" \
      org.opencontainers.image.revision=$SOURCE_REVISION
COPY --chown=node:node apps/server/dist /app/apps/server/dist
COPY --chown=node:node apps/web/dist /app/apps/web/dist
ENV HOST=0.0.0.0 PORT=4339 PROOF_PORT=4439
EXPOSE 4339
ENV ACADEMY_WEB_DIST=/app/apps/web/dist
CMD ["node", "apps/server/dist/main.js"]
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(async r=>{const b=await r.json();process.exit(r.ok&&b.ok&&b.proof?0:1)}).catch(()=>process.exit(1))"]
