import {DAY_PACKS} from '../content/days/index.mjs';
import {WAVE_DAYS,courseOrder} from '../content/days/course.mjs';

// Default route without a composed course stays Worldline Wave 1–7.
// Harness packs (8+) are opt-in via room.course (e.g. Harness Engineering template).
const DEFAULT_ORDER=WAVE_DAYS.filter(day=>DAY_PACKS.some(pack=>pack.day===day));

// A composed course (AET-92, room.course.days) sets the order; without one the packs run Wave 1..7.
export const courseDays=room=>room.course?.days?.map(entry=>entry.day)??DEFAULT_ORDER;

// The one release rule for day packs, screen state and the FAQ: every course day up to the
// furthest day the room has reached. The facilitator's live pointer (room.day) can step back
// without taking anything away, so once the room reached its last day everything stays open.
// A read-only cohort session exists only after the access window, so the training is over.
export function releasedDays(room,{readOnly=false}={}){
 const order=courseDays(room);
 if(readOnly)return [...order];
 const reach=Math.max(order.indexOf(room.day),order.indexOf(room.reachedDay));
 return order.slice(0,reach+1);
}

export function recordReach(room){
 const order=courseDays(room);
 if(order.indexOf(room.day)>order.indexOf(room.reachedDay))room.reachedDay=room.day;
}

export {courseOrder};
