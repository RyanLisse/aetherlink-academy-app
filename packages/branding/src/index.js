/** Academy chrome helpers (AET-51). Pure; no global CSS injection. */
export const ACADEMY_RETURN_PARAM = 'returnTo';

export function academyReturnUrl(academyOrigin, {path = '/', query = {}} = {}) {
  const url = new URL(path, academyOrigin);
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export function backToAcademyHref(launchClaims, academyOrigin) {
  const returnTo = typeof launchClaims?.returnTo === 'string' && launchClaims.returnTo
    ? launchClaims.returnTo
    : academyReturnUrl(academyOrigin);
  return returnTo;
}

export const THEMING_HOOKS = Object.freeze({
  slides: ['defineDesignSystem', 'app/global.css'],
  chat: ['toolkit css vars', 'brandName', 'brandHref', 'brandIcon'],
  assets: ['toolkit sidebar brand props'],
  calendar: ['toolkit sidebar brand props'],
  clips: ['toolkit sidebar brand props'],
  content: ['toolkit sidebar brand props'],
});
