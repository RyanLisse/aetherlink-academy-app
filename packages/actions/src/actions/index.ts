import {emptyRegistry, registerAction} from '../registry.ts';
import {detach} from './detach.ts';
import {everyoneBackToFollow} from './everyone-back-to-follow.ts';
import {followAgain} from './follow-again.ts';
import {getParticipantCount} from './get-participant-count.ts';
import {getScreenState} from './get-screen-state.ts';
import {gotoSlide} from './goto-slide.ts';
import {nextSlide} from './next-slide.ts';
import {openLesson} from './open-lesson.ts';
import {pauseUntil} from './pause-until.ts';
import {prevSlide} from './prev-slide.ts';
import {setReveal} from './set-reveal.ts';
import {startTimer} from './start-timer.ts';
import {togglePlanB} from './toggle-plan-b.ts';
import {releaseLesson} from './release-lesson.ts';
import {scheduleLesson} from './schedule-lesson.ts';
import {cancelSchedule} from './cancel-schedule.ts';

export {ClassroomState, ClassroomStateLive} from './state.ts';
export {LivePresenter, requireLiveRoom, type LivePresenterShape} from './live-state.ts';
export {ReleasePolicy, requireSquadRoom, type ReleasePolicyShape} from './release-policy.ts';

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

export const registry = withRelease;
