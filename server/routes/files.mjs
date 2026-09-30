export function registerFileRoutes(app, deps) {
  const { files, deckActor, browser, wrap } = deps;

  const fileId = (req) => String(req.params.fileId || '');
  const downloadName = (name) =>
    name.replace(/[^\p{L}\p{N}._ -]+/gu, '_').slice(0, 200) || 'bestand';
  app.post(
    '/game/files',
    wrap(async (req, res) =>
      res.status(201).json(
        await files.run('uploadFile', deckActor(await browser(req)), {
          filename: req.query.filename,
          contentType: req.query.contentType,
          bytes: req.body,
        }),
      ),
    ),
  );
  app.get(
    '/game/files',
    wrap(async (req, res) =>
      res.json(await files.run('listFiles', deckActor(await browser(req)))),
    ),
  );
  app.get(
    '/game/files/:fileId',
    wrap(async (req, res) => {
      const file = await files.run('getFile', deckActor(await browser(req)), {
        fileId: fileId(req),
      });
      // SVG renders as same-origin script, so only raster images are served inline.
      const inline =
        file.contentType.startsWith('image/') &&
        file.contentType !== 'image/svg+xml';
      res.attachment(downloadName(file.filename)).type(file.contentType);
      if (inline)
        res.set(
          'Content-Disposition',
          res.get('Content-Disposition').replace(/^attachment/, 'inline'),
        );
      res
        .set('Cache-Control', 'private, no-store')
        .send(Buffer.from(file.bytes));
    }),
  );
  app.delete(
    '/game/files/:fileId',
    wrap(async (req, res) =>
      res.json(
        await files.run('deleteFile', deckActor(await browser(req)), {
          fileId: fileId(req),
        }),
      ),
    ),
  );
}
