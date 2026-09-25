/**
 * voice.ts — pre-render Scrimlab captions with Microsoft Edge neural TTS (free, no key).
 *
 * OPTIONAL dependency: msedge-tts is not a package/workspace dep (pnpm 11 ignores
 * its install scripts unless approved). Install locally when you need voice assets:
 *
 *   pnpm add -D msedge-tts@^2.0.7 --filter @academy/arcade-lab
 *   # or: pnpm --filter @academy/arcade-lab exec npm i -D msedge-tts@^2.0.7
 *
 * Then:
 *   pnpm --filter @academy/arcade-lab run says
 *   pnpm --filter @academy/arcade-lab run public/voice
 *
 *   npx tsx voice.ts says.json out/            # one JSON per lesson: { id, voice, clips: { [sayIndex]: "data:audio/mpeg;base64,…" } }
 *
 * Input: [{ id, says: string[] }] — the `say` ops of each lesson, in order.
 * Scrimlab loads out/<lessonId>.json next to the page when Voice is on.
 *
 * Player / `pnpm check` / Vite build do NOT import this module.
 */
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

type LessonSays = { id: string; says: string[] };
type VoiceFile = { id: string; voice: string; clips: Record<number, string> };

const VOICE = process.env.TTS_VOICE ?? "en-US-AndrewMultilingualNeural";
const [input, outDir = "out"] = process.argv.slice(2);
if (!input) throw new Error("usage: voice.ts <says.json> [outDir]");

// Captions use **bold** and `code`; strip markup and make paths/identifiers speakable.
const speakable = (s: string) =>
  s.replace(/\*\*/g, "").replace(/`/g, "")
   .replace(/([a-z])\/([a-z])/gi, "$1 slash $2")
   .replace(/\.(md|ts|py|json)\b/g, " dot $1")
   .replace(/_/g, " ");

const synth = async (tts: MsEdgeTTS, text: string): Promise<Buffer> => {
  const { audioStream } = tts.toStream(speakable(text));
  const chunks: Buffer[] = [];
  for await (const c of audioStream) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks);
};

const lessons: LessonSays[] = JSON.parse(readFileSync(input, "utf8"));
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

for (const lesson of lessons) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const clips: Record<number, string> = {};
  for (const [k, say] of lesson.says.entries()) {
    const mp3 = await synth(tts, say);
    clips[k] = `data:audio/mpeg;base64,${mp3.toString("base64")}`;
  }
  const file: VoiceFile = { id: lesson.id, voice: VOICE, clips };
  writeFileSync(join(outDir, `${lesson.id}.json`), JSON.stringify(file));
  const kb = Math.round(Object.values(clips).join("").length * 0.75 / 1024);
  console.log(`${lesson.id}: ${lesson.says.length} clips, ~${kb} KB`);
}
