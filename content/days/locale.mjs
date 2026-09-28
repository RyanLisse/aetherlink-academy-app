/** Locale projection for day packs (AET-116 locale content lock).
 * Packs may declare `copy:{en,nl}` with learner-facing strings.
 * Wave packs without `copy` stay author-language (NL) for both locales until retrofit.
 * Harness packs (localeComplete:true) MUST ship real en+nl — reject at lint otherwise.
 */

export const CONTENT_LOCALES = ['en', 'nl'];

export function normalizeContentLocale(raw) {
  return raw === 'en' ? 'en' : 'nl';
}

/** Merge locale copy onto a projected pack (returns new object). */
export function projectPackLocale(pack, locale = 'nl') {
  const lang = normalizeContentLocale(locale);
  const copy = pack?.copy?.[lang] || pack?.copy?.en || null;
  if (!copy) {
    return {
      ...pack,
      locale: lang,
      localeComplete: Boolean(pack?.copy?.en && pack?.copy?.nl),
    };
  }

  const lesson = {
    ...(pack.lesson || {}),
    ...(copy.kicker !== undefined ? {kicker: copy.kicker} : {}),
    ...(copy.lessonTitle !== undefined ? {title: copy.lessonTitle} : {}),
    ...(copy.leerdoel !== undefined ? {lede: copy.leerdoel} : {}),
    ...(copy.motto !== undefined ? {motto: copy.motto} : {}),
    ...(copy.narrative !== undefined ? {narrative: copy.narrative} : {}),
    ...(copy.loop !== undefined ? {loop: copy.loop} : {}),
    ...(copy.workedExample !== undefined ? {workedExample: copy.workedExample} : {}),
  };

  const diagrams = (copy.diagrams || pack.diagrams || []).map((d) => ({
    src: d.src,
    title: typeof d.title === 'object' ? (d.title[lang] || d.title.en) : d.title,
    alt: typeof d.alt === 'object' ? (d.alt[lang] || d.alt.en || d.title) : (d.alt || d.title),
  }));

  const materials = copy.materials || pack.materials;
  const steps = copy.solo || pack.steps;
  const sims = (pack.sims || []).map((ref) => ({
    ...ref,
    ...(copy.simTitles?.[ref.id] ? {title: copy.simTitles[ref.id]} : {}),
  }));

  return {
    ...pack,
    locale: lang,
    localeComplete: Boolean(pack?.copy?.en && pack?.copy?.nl),
    title: copy.title ?? pack.title,
    tag: copy.tag ?? pack.tag,
    blurb: copy.blurb ?? pack.blurb,
    leerdoel: copy.leerdoel ?? pack.leerdoel,
    lesson,
    steps,
    materials,
    reviewCriteria: copy.proof ?? pack.reviewCriteria,
    openItems: copy.openItems ?? pack.openItems,
    demo: copy.demo ?? pack.demo,
    mission: copy.mission
      ? {stop: pack.mission?.stop, ...copy.mission, checks: copy.proof ?? pack.mission?.checks}
      : pack.mission,
    diagrams,
    sims,
    attribution: copy.attribution ?? pack.attribution,
    ...(copy.quiz ? {quiz: copy.quiz} : {}),
  };
}

export function assertLocaleComplete(pack, at = `day ${pack?.day}`) {
  if (!(pack?.copy?.en && pack?.copy?.nl)) {
    if (pack?.kind === 'harness' || pack?.requireLocales) {
      throw new Error(`${at}: harness/locale-complete pack missing real en+nl copy`);
    }
    return;
  }
  for (const lang of CONTENT_LOCALES) {
    const c = pack.copy?.[lang];
    if (!c || typeof c !== 'object') throw new Error(`${at}: missing copy.${lang}`);
    for (const key of ['title', 'lessonTitle', 'leerdoel', 'motto', 'narrative', 'workedExample', 'loop']) {
      if (c[key] === undefined || c[key] === null || c[key] === '') {
        throw new Error(`${at}: copy.${lang}.${key} required`);
      }
    }
    if (!Array.isArray(c.narrative) || c.narrative.length < 2) {
      throw new Error(`${at}: copy.${lang}.narrative must have ≥2 paragraphs`);
    }
    if (lang === 'nl') {
      const blob = JSON.stringify(c);
      if (/TODO|FIXME|PLACEHOLDER|\[NL\]|lorem ipsum/i.test(blob)) {
        throw new Error(`${at}: copy.nl looks like a placeholder`);
      }
      if (JSON.stringify(c.narrative) === JSON.stringify(pack.copy.en.narrative)) {
        throw new Error(`${at}: copy.nl.narrative must differ from EN (no silent EN leak)`);
      }
    }
  }
}
