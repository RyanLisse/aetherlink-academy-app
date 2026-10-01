/** AET-134 · clickable HTML Solo companions on /workshop/4 chrome (AET-130 paths).
 *  Kept out of workshop4-slides.ts so content/days/validate loadDeckSlides
 *  (Object.values(mod).find(Array.isArray)) still resolves the slide deck.
 */
export const W4_SOLO_COMPANIONS: ReadonlyArray<{readonly label: string; readonly href: string}> = [
  {label: "weather", href: "/courses/weather-agent-sdk/index.html"},
  {label: "day5 n8n→agent (optional parity bonus)", href: "/courses/aetherlink-day5-n8n-to-agent/index.html"},
  {label: "council", href: "/courses/council-agent-sdk/index.html"},
];
