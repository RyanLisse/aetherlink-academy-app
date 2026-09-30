import { fail } from '../store.mjs';

export const text = (v, max = 4000) => {
  if (typeof v !== 'string' || !v.trim() || v.length > max)
    fail(400, `Vul tekst in (maximaal ${max} tekens).`);
  return v.trim();
};
export const namedCookie = (req, name) => {
  const value = req.headers.cookie
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  if (value === undefined) return;
  try {
    return decodeURIComponent(value);
  } catch {
    return;
  }
};
export const cookie = (req) => namedCookie(req, 'academy');
export const uuid = (v) => {
  if (
    typeof v !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  )
    fail(400, 'Ongeldige id.');
  return v;
};
export const bearer = (req) =>
  req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
