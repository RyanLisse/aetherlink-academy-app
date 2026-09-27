/**
 * Arcade Lab catalog for in-room assign (AET-87).
 * Ids match apps/arcade-lab/LESSON-ID-CONTRACT.md — no second sandbox.
 * Titles are facilitator-facing labels (LH playground clarity), not raw URLs.
 */

/** @typedef {{id:string,title:string,track:'eve'|'sdk'|'sample',workshop?:number}} ArcadeLesson */

/** @type {readonly ArcadeLesson[]} */
export const ARCADE_CATALOG = Object.freeze([
  {id:'ws-1-eve-weather',title:'1 · Eve · Weather agent job',track:'eve',workshop:1},
  {id:'ws-2-eve-state',title:'2 · Eve · Session, turn, step & state',track:'eve',workshop:2},
  {id:'ws-3-eve-approval',title:'3 · Eve · Human-in-the-loop approval',track:'eve',workshop:3},
  {id:'ws-2-eve-council',title:'4 · Eve · Council (four views)',track:'eve',workshop:4},
  {id:'ws-5-sdk-quickstart',title:'5 · SDK · Quickstart (find & fix)',track:'sdk',workshop:5},
  {id:'ws-3-sdk-weather',title:'6 · SDK · Weather as custom tool',track:'sdk',workshop:6},
  {id:'ws-7-sdk-hooks',title:'7 · SDK · Hooks (gate a tool)',track:'sdk',workshop:7},
  {id:'ws-8-sdk-subagents',title:'8 · SDK · Subagents (lead delegates)',track:'sdk',workshop:8},
  {id:'ws-4-sdk-council',title:'9 · Appendix · Gateway council',track:'sdk',workshop:9},
  {id:'sample-counter',title:'Sample · Click counter (demo)',track:'sample'},
]);

const BY_ID = new Map(ARCADE_CATALOG.map(lesson => [lesson.id, lesson]));

export function arcadeLesson(id) {
  return typeof id === 'string' ? BY_ID.get(id) ?? null : null;
}

/** Pack-shaped declaration for resolveLabs. Always same-origin Arcade with embed=1. */
export function arcadeLabDeclaration(id, title) {
  const lesson = arcadeLesson(id);
  if (!lesson) return null;
  return {
    id: lesson.id,
    src: `/arcade-lab/?lesson=${encodeURIComponent(lesson.id)}&embed=1`,
    title: (typeof title === 'string' && title.trim()) || lesson.title,
  };
}

/** Room assignment → declarations. Closed / unknown entries yield nothing for learners. */
export function roomLabDeclarations(room, day, {includeClosed = false} = {}) {
  const entry = room?.labByDay?.[String(day)];
  if (!entry || typeof entry !== 'object') return [];
  if (!includeClosed && entry.open !== true) return [];
  const declaration = arcadeLabDeclaration(entry.id, entry.title);
  return declaration ? [declaration] : [];
}

export function parseLabAssign(value) {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null;
  const lessonId = value.lessonId === null || value.lessonId === '' ? null : value.lessonId;
  if (lessonId !== null && !arcadeLesson(lessonId)) return null;
  const open = value.open === undefined ? true : value.open === true;
  if (typeof open !== 'boolean') return null;
  const day = value.day === undefined ? undefined : Number(value.day);
  if (day !== undefined && (!Number.isInteger(day) || day < 1 || day > 7)) return null;
  const title = typeof value.title === 'string' ? value.title.trim().slice(0, 120) : undefined;
  return {lessonId, open, day, title};
}
