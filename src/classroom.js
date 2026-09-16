/** Wave daily deck — Google Slides embed (LIS-54 v1). Free browse; day is chrome hint only. */
export const CLASSROOM_DECK_ID = '1DZ9-9XynhHBj62e-_r9wAy3MQHOni85VCGnW6kgh8bI';

export const SLIDES_EMBED_URL =
  `https://docs.google.com/presentation/d/${CLASSROOM_DECK_ID}/embed?start=false&loop=false&delayms=60000`;

export function classroomEmbedUrl(day) {
  const url = new URL(SLIDES_EMBED_URL);
  // day is chrome-only; keep URL free-browse (no slide lock)
  if (day != null) url.searchParams.set('rm', 'minimal');
  return url.toString();
}
