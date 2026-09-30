export function registerHealthRoute(app, deps) {
  const { wrap } = deps;

  app.get(
    '/game/health',
    wrap(async (_req, res) => {
      res.json({
        ok: true,
        revision:
          process.env.VERCEL_GIT_COMMIT_SHA ||
          process.env.SOURCE_REVISION ||
          null,
      });
    }),
  );
}
