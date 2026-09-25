import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyJoinError} from '../src/join-errors.mjs';
import {INVALID_COHORT_CODE_MESSAGE,COHORT_EXPIRED_MESSAGE,COHORT_NO_ROOM_MESSAGE,COHORT_RATE_LIMIT_MESSAGE} from '../server/cohort.mjs';
import {DUPLICATE_PARTICIPANT_MESSAGE,INVALID_PARTICIPANT_ACCESS_MESSAGE,COHORT_ROOM_JOIN_MESSAGE} from '../server/store.mjs';
import en from '../src/i18n/en.json' with {type:'json'};
import nl from '../src/i18n/nl.json' with {type:'json'};

const cases=[
  [INVALID_COHORT_CODE_MESSAGE,'cohortInvalid','code'],
  [COHORT_EXPIRED_MESSAGE,'cohortExpired','code'],
  [COHORT_NO_ROOM_MESSAGE,'cohortNoRoom',null],
  [COHORT_RATE_LIMIT_MESSAGE,'cohortRate',null],
  ['Te veel verzoeken. Wacht even.','cohortRate',null],
  [COHORT_ROOM_JOIN_MESSAGE,'cohortRoom','code'],
  ['Ongeldige facilitator-startsleutel.','hostKey','hostKey'],
  [INVALID_PARTICIPANT_ACCESS_MESSAGE,'accessInvalid',null],
  [DUPLICATE_PARTICIPANT_MESSAGE,'duplicate','name'],
  ['Kamercode niet gevonden.','room','code'],
  ['Squad is vol (maximaal 12).','full',null],
];

test('every gateway join failure maps to a titled, translated state on the right field',()=>{
  for(const [message,kind,field] of cases){
    const result=classifyJoinError(message);
    assert.deepEqual(result,{key:`join.err.${kind}`,title:`join.errTitle.${kind}`,field},message);
    for(const dict of [nl,en]){assert.equal(typeof dict[result.key],'string',result.key);assert.equal(typeof dict[result.title],'string',result.title);}
  }
});

test('unknown failures keep the server text under a generic title; no error means no state',()=>{
  assert.deepEqual(classifyJoinError('Onverwachte serverfout.'),{key:null,title:'join.errTitle.generic',field:null,message:'Onverwachte serverfout.'});
  assert.equal(nl['join.errTitle.generic'],'Aanmelden lukte niet');
  assert.equal(classifyJoinError(''),null);
});

test('nl and en carry the same status and join keys',()=>{
  const keys=dict=>Object.keys(dict).filter(key=>/^(status|join)\./.test(key)).sort();
  assert.deepEqual(keys(en),keys(nl));
});
