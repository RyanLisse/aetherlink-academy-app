import {DAY_PACKS} from '../days/index.mjs';
import {loadDeckSlides,validateDayPacks} from '../days/validate.mjs';

const root=process.cwd();
const errors=validateDayPacks(DAY_PACKS,{root,decks:await loadDeckSlides(root)});
for(const error of errors)console.error(`✗ ${error}`);
if(errors.length)process.exit(1);
console.log(`✓ ${DAY_PACKS.length} day packs: fields, quiz keys, starter files and slide citations match the decks`);
