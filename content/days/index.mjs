import day1 from './day-1-classroom-1.mjs';
import day2 from './day-2-classroom-2.mjs';
import day3 from './day-3-workshop-n8n.mjs';
import day4 from './day-4-workshop-agent-sdk.mjs';
import day5 from './day-5-workshop-sdlc.mjs';
import day6 from './day-6-workshop-thin-slice.mjs';
import day7 from './day-7-workshop-ship.mjs';
import {projectDayPack} from './model.mjs';

export const DAY_SOURCES=[day1,day2,day3,day4,day5,day6,day7];
export const DAY_PACKS=DAY_SOURCES.map(projectDayPack);
export const DAY_COUNT=DAY_PACKS.length;
