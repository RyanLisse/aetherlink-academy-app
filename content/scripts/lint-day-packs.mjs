import {DAY_PACKS} from '../days/index.mjs';
import {loadDeckSlides,validateDayPacks} from '../days/validate.mjs';
import {dayPackIssues} from '../../server/day-pack-lint.mjs';
import {starterFileNames} from '../../server/content.mjs';

const root=process.cwd();
const errors=[
 ...dayPackIssues(DAY_PACKS,{starterDir:`${root}/starter`,starterFileNames}),
 ...validateDayPacks(DAY_PACKS,{root,decks:await loadDeckSlides(root)})
];
for(const error of errors)console.error(`✗ ${error}`);
if(errors.length)process.exit(1);
console.log(`✓ ${DAY_PACKS.length} day packs: fields, quiz keys, starter files and slide citations match the decks`);
