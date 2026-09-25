import type {DeckSlide} from '@academy/deck';
import {normalizeSlides} from '../deck/normalize.js';
import {sourceSlides} from '../deck/slides.js';
import {workshop3SourceSlides} from '../deck/workshop3-slides.js';
import {workshop4SourceSlides} from '../deck/workshop4-slides.js';
import {workshop5SourceSlides} from '../deck/workshop5-slides.js';
import {workshop6SourceSlides} from '../deck/workshop6-slides.js';
import {workshop7SourceSlides} from '../deck/workshop7-slides.js';

export interface ReferenceDay {
  readonly day: number;
  readonly label: string;
  readonly lessonId: string;
  readonly slides: ReadonlyArray<DeckSlide>;
}

const classroom = normalizeSlides(sourceSlides);
const lesson = (slides: ReadonlyArray<DeckSlide>, lessonId: string) => slides.filter((slide) => slide.lessonId === lessonId);

/** One lesson per day in the bundled decks; the workshop kickers name their day ("Workshop 3 · Day 3"). */
export const REFERENCE_DAYS: ReadonlyArray<ReferenceDay> = [
  {day: 1, label: 'Classroom 1', lessonId: 'teaching-day-1', slides: lesson(classroom, 'teaching-day-1')},
  {day: 2, label: 'Classroom 2', lessonId: 'teaching-day-2', slides: lesson(classroom, 'teaching-day-2')},
  {day: 3, label: 'Workshop 3', lessonId: 'workshop-3', slides: normalizeSlides(workshop3SourceSlides)},
  {day: 4, label: 'Workshop 4', lessonId: 'workshop-4', slides: normalizeSlides(workshop4SourceSlides)},
  {day: 5, label: 'Workshop 5', lessonId: 'workshop-5', slides: normalizeSlides(workshop5SourceSlides)},
  {day: 6, label: 'Workshop 6', lessonId: 'workshop-6', slides: normalizeSlides(workshop6SourceSlides)},
  {day: 7, label: 'Workshop 7', lessonId: 'workshop-7', slides: normalizeSlides(workshop7SourceSlides)},
];

/** Same anchor format the server's `search_content` returns: `slide-<lessonSlug>-<ordinal>`. */
export const slideAnchor = (slide: DeckSlide): string => `slide-${slide.lessonId}-${slide.ordinal}`;

export const dayPath = (day: number, anchor?: string | null): string => `/reference/day/${day}${anchor ? `#${anchor}` : ''}`;
