/**
 * Wave Workshop catalog for facilitator teach-mode (no room / no Create gate).
 * Titles mirror content/days packs 1–7; paths reuse classroomPathForDay.
 */
import {classroomPathForDay} from "./classroom.js";

export const TEACH_WAVE_DAYS = Object.freeze([
  {day: 1, title: "Classroom 1 · AI and Claude Code", titleNl: "Classroom 1 · AI en Claude Code"},
  {day: 2, title: "Classroom 2 · Reusable workflows", titleNl: "Classroom 2 · Herbruikbare workflows"},
  {day: 3, title: "Workshop 3 · Agents in n8n", titleNl: "Workshop 3 · Agents in n8n"},
  {day: 4, title: "Workshop 4 · Support agents with the Claude Agent SDK", titleNl: "Workshop 4 · Support-agents met de Claude Agent SDK"},
  {day: 5, title: "Workshop 5 · AI-native SDLC", titleNl: "Workshop 5 · AI-native SDLC"},
  {day: 6, title: "Workshop 6 · Own assignment: thin slice", titleNl: "Workshop 6 · Eigen opdracht: thin slice"},
  {day: 7, title: "Workshop 7 · Own assignment: ship it", titleNl: "Workshop 7 · Eigen opdracht: ship it"},
]);

export function teachDayTitle(day, locale = "en") {
  const entry = TEACH_WAVE_DAYS.find((d) => d.day === day);
  if (!entry) return "";
  return locale === "nl" ? entry.titleNl : entry.title;
}

export function teachLessonHref(day) {
  return classroomPathForDay(day);
}
