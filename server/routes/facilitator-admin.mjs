import { fail } from '../store.mjs';
import { uuid } from './shared.mjs';

// Facilitator-only deletes for squads (rooms) and Wave cohorts. Auth is the same as every
// other facilitator route: a valid academy-facilitator cookie or the host key in the body.
export function registerFacilitatorAdminRoutes(app, deps) {
  const { store, files, requireFacilitator, wrap } = deps;

  // Uploaded room files live in object storage; remove them before the room row goes so no
  // participant upload outlives its squad. A storage failure keeps the room (retry is safe).
  const removeRoomFiles = async (roomId) => {
    if (!files?.configured) return 0;
    const actor = { roomId, id: 'facilitator', name: 'Facilitator', role: 'facilitator', source: 'human' };
    let listed;
    try {
      listed = await files.run('listFiles', actor);
    } catch {
      fail(502, 'Could not remove the squad files; the squad was not deleted. Try again.');
    }
    for (const file of listed.files) {
      try {
        await files.run('deleteFile', actor, { fileId: file.id });
      } catch (error) {
        if (error?.tag !== 'FileNotFound')
          fail(502, 'Could not remove the squad files; the squad was not deleted. Try again.');
      }
    }
    return listed.files.length;
  };

  app.post(
    '/game/facilitator/room/delete',
    wrap(async (req, res) => {
      await requireFacilitator(req);
      const roomId = uuid(req.body?.roomId);
      await store.roomExists(roomId);
      const filesRemoved = await removeRoomFiles(roomId);
      res.json({ ...(await store.deleteRoom(roomId)), files: filesRemoved });
    }),
  );
  app.post(
    '/game/facilitator/cohort/delete',
    wrap(async (req, res) => {
      await requireFacilitator(req);
      res.json(await store.deleteCohort(uuid(req.body?.cohortId)));
    }),
  );
}
