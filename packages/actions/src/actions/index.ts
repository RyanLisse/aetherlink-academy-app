import {emptyRegistry, registerAction} from '../registry.ts';
import {cancelSchedule} from './cancel-schedule.ts';
import {detach} from './detach.ts';
import {everyoneBackToFollow} from './everyone-back-to-follow.ts';
import {followAgain} from './follow-again.ts';
import {getAssignment} from './get-assignment.ts';
import {getConnectionState} from './get-connection-state.ts';
import {getCurrentSlide} from './get-current-slide.ts';
import {getDocument} from './get-document.ts';
import {getLesson} from './get-lesson.ts';
import {getMission} from './get-mission.ts';
import {getMyProgress} from './get-my-progress.ts';
import {getParticipantCount} from './get-participant-count.ts';
import {getScreenState} from './get-screen-state.ts';
import {gotoSlide} from './goto-slide.ts';
import {nextSlide} from './next-slide.ts';
import {openHint} from './open-hint.ts';
import {openLesson} from './open-lesson.ts';
import {pauseUntil} from './pause-until.ts';
import {prevSlide} from './prev-slide.ts';
import {releaseLesson} from './release-lesson.ts';
import {scheduleLesson} from './schedule-lesson.ts';
import {searchKnowledge} from './search-knowledge.ts';
import {setReveal} from './set-reveal.ts';
import {startTimer} from './start-timer.ts';
import {submitEvidence} from './submit-evidence.ts';
import {answerSelfCheck} from './answer-self-check.ts';
import {exportDebrief} from './export-debrief.ts';
import {handoff} from './handoff.ts';
import {markPractised, unmarkPractised} from './mark-practised.ts';
import {reviewEvidence} from './review-evidence.ts';
import {suggestDocument} from './suggest-document.ts';
import {togglePlanB} from './toggle-plan-b.ts';

export {ClassroomState, ClassroomStateLive} from './state.ts';
export {LivePresenter, requireLiveRoom, type LivePresenterShape} from './live-state.ts';
export {ReleasePolicy, requireSquadRoom, type ReleasePolicyShape} from './release-policy.ts';
export {
  AcademyContent,
  AcademyContentLive,
  AcademyContentMemory,
  type AcademyContentShape,
  type LessonRecord,
  type AssignmentRecord,
} from './academy-content.ts';
export {
  ParticipantContext,
  ParticipantContextLive,
  ParticipantContextMemory,
  AmbiguousViewContext,
  type ParticipantViewBinding,
} from './participant-context.ts';
export {EvidenceServices, type EvidenceServicesShape} from './evidence-services.ts';
export {
  LessonNotReleased,
  LOCKED_LESSON_DENIAL,
  lockedLessonDenialBody,
  requireReleased,
} from './release-gate.ts';

const withCore = registerAction(registerAction(registerAction(emptyRegistry, getScreenState), startTimer), getParticipantCount);
const withNav = registerAction(registerAction(registerAction(registerAction(withCore, nextSlide), prevSlide), gotoSlide), setReveal);
const withLive = registerAction(
  registerAction(
    registerAction(registerAction(registerAction(registerAction(withNav, togglePlanB), pauseUntil), everyoneBackToFollow), openLesson),
    detach,
  ),
  followAgain,
);

const withRelease = registerAction(
  registerAction(registerAction(withLive, releaseLesson), scheduleLesson),
  cancelSchedule,
);

/** F2 participant MCP tools (AET-44) + legacy five names kept until migration. */
const withParticipant = registerAction(
  registerAction(
    registerAction(
      registerAction(
        registerAction(
          registerAction(registerAction(withRelease, getLesson), getCurrentSlide),
          getAssignment,
        ),
        submitEvidence,
      ),
      openHint,
    ),
    getMyProgress,
  ),
  getConnectionState,
);

const withLegacy = registerAction(
  registerAction(
    registerAction(registerAction(withParticipant, getMission), getDocument),
    searchKnowledge,
  ),
  suggestDocument,
);

const withEvidence = registerAction(
  registerAction(
    registerAction(
      registerAction(
        registerAction(registerAction(withLegacy, reviewEvidence), handoff),
        markPractised,
      ),
      unmarkPractised,
    ),
    answerSelfCheck,
  ),
  exportDebrief,
);

export const registry = withEvidence;
