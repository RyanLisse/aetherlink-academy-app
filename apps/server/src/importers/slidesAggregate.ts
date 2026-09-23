import type {Slide} from '@academy/schema';
import type {CourseAggregateDraft} from '../db/curriculum-repo.ts';
import {stableUuid} from './stableUuid.ts';

/** Build a minimal CourseAggregateDraft that carries imported slides (never published by writeDraft). */
export const slidesToAggregate = (courseId: string, slides: ReadonlyArray<Slide>, seed = 'import'): CourseAggregateDraft => {
  const trackId = stableUuid(`${courseId}:${seed}:track`);
  const dayId = stableUuid(`${courseId}:${seed}:day`);
  const lessonGroups = new Map<string, Slide[]>();
  for (const slide of slides) {
    const group = lessonGroups.get(slide.lessonId) ?? [];
    group.push(slide);
    lessonGroups.set(slide.lessonId, group);
  }
  if (lessonGroups.size === 0) {
    lessonGroups.set('imported-lesson', []);
  }

  const lessons = [...lessonGroups.keys()].map((lessonKey, index) => ({
    id: stableUuid(`${courseId}:${seed}:lesson:${lessonKey}`),
    dayId,
    slug: `imported-${index + 1}`,
    title: {en: lessonKey},
    mode: 'guided' as const,
    durationMinutes: 45,
  }));

  const lessonIdByKey = new Map([...lessonGroups.keys()].map((key, index) => [key, lessons[index]!.id]));

  const dbSlides = slides.map((slide) => {
    const {id: _legacyId, lessonId: legacyLessonId, ...rest} = slide;
    return {
      id: stableUuid(`${courseId}:${seed}:slide:${legacyLessonId}:${slide.ordinal}:${slide.title}`),
      lessonId: lessonIdByKey.get(legacyLessonId) ?? lessons[0]!.id,
      ...rest,
    };
  });

  return {
    tracks: [{id: trackId, ordinal: 1, name: {en: 'Imported'}}],
    days: [{id: dayId, trackId, ordinal: 1, kind: 'teaching', title: {en: 'Imported day'}}],
    lessons,
    slides: dbSlides as CourseAggregateDraft['slides'],
    assignments: [],
    quizQuestions: [],
  };
};
