/** Parse Agent Arcade lesson markdown into structured steps. */

/**
 * @param {string} markdown
 * @returns {{title:string, meta:Record<string,string>, steps:Array<{heading:string, coach:{mensentaal:string, tech:string}, checkpoint:string|null, expected:string|null, playground:string}>}}
 */
export function parseLessonMarkdown(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  let title = '';
  /** @type {Record<string,string>} */
  const meta = {};
  const bodyStart = (() => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!title && line.startsWith('# ')) {
        title = line.slice(2).trim();
        continue;
      }
      const m = /^\*\*([^*]+):\*\*\s*(.*)$/.exec(line);
      if (m) {
        meta[m[1].trim().toLowerCase()] = m[2].trim();
        continue;
      }
      if (line.startsWith('## ')) return i;
    }
    return lines.length;
  })();

  const steps = [];
  let i = bodyStart;
  while (i < lines.length) {
    if (!lines[i].startsWith('## ')) {
      i += 1;
      continue;
    }
    const heading = lines[i].slice(3).trim();
    i += 1;
    const chunk = [];
    while (i < lines.length && !lines[i].startsWith('## ')) {
      chunk.push(lines[i]);
      i += 1;
    }
    steps.push(parseStep(heading, chunk.join('\n')));
  }

  return { title, meta, steps };
}

function cleanInline(value) {
  if (!value) return null;
  let text = String(value).trim();
  if (text.startsWith('`') && text.endsWith('`') && text.indexOf('`', 1) === text.length - 1) {
    text = text.slice(1, -1).trim();
  }
  return text || null;
}

/**
 * @param {string} heading
 * @param {string} body
 */
function parseStep(heading, body) {
  const fields = splitFields(body);
  return {
    heading,
    coach: {
      mensentaal: (fields.coach_mensentaal || '').trim(),
      tech: (fields.coach_tech || '').trim(),
    },
    checkpoint: cleanInline(fields.checkpoint),
    expected: cleanInline(fields.expected),
    playground: (fields.playground || '').trim(),
  };
}

/** Split ### field blocks. */
function splitFields(body) {
  /** @type {Record<string,string>} */
  const out = {};
  const parts = body.split(/^###\s+/m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const key = (nl === -1 ? part : part.slice(0, nl)).trim().toLowerCase();
    const value = nl === -1 ? '' : part.slice(nl + 1);
    out[key] = value.replace(/\n+$/, '');
  }
  return out;
}

/**
 * @param {object} manifest
 * @param {string} path
 */
export function matchArcadeRoute(manifest, path) {
  const pathname = normalizePath(path);
  if (pathname === '/arcade' || pathname === '/arcade/') {
    return { kind: 'hub' };
  }
  const lesson = (manifest?.lessons || []).find((l) => normalizePath(l.route) === pathname);
  if (lesson) return { kind: 'lesson', lesson };
  if (pathname === '/arcade/facilitator' || pathname === '/arcade/notes') {
    return { kind: 'facilitator' };
  }
  return { kind: 'unknown', pathname };
}

export function normalizePath(path) {
  if (!path) return '/';
  const bare = String(path).split('?')[0].split('#')[0];
  if (bare.length > 1 && bare.endsWith('/')) return bare.slice(0, -1);
  return bare || '/';
}

export function isArcadePath(path) {
  const p = normalizePath(path);
  return p === '/arcade' || p.startsWith('/arcade/');
}
