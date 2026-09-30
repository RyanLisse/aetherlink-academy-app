export function registerHealthRoute(app, deps) {
  const { proofBase, wrap } = deps;

  app.get(
    '/game/health',
    wrap(async (_req, res) => {
      let connected = false;
      try {
        connected = (
          await fetch(proofBase + '/health', {
            signal: AbortSignal.timeout(2000),
          })
        ).ok;
      } catch {}
      res.json({
        ok: true,
        proof: connected,
        revision:
          process.env.VERCEL_GIT_COMMIT_SHA ||
          process.env.SOURCE_REVISION ||
          null,
      });
    }),
  );
}
