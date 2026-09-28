import test from 'node:test';
import assert from 'node:assert/strict';
import {classroomExerciseSources,classroomExercises,exercisesForDay} from '../../content/exercises/classroom-days.mjs';

const fields=['problem','explanation','diagram','walkthrough','tryIt','evidence','reflection','deepDive','code'];

test('covers every actual assignment on teaching days one and two',()=>{
  assert.deepEqual(exercisesForDay(1).map(item=>item.assignment),[1,2,3,4]);
  assert.deepEqual(exercisesForDay(2).map(item=>item.assignment),[5,6,7,8,9,10,11,12,13]);
  assert.equal(classroomExercises.length,13);
});

test('every assignment has a complete, bilingual display-only lesson structure',()=>{
  for(const item of classroomExercises){
    for(const field of fields)assert.ok(item[field],`${item.id} is missing ${field}`);
    assert.ok(item.walkthrough.length>=4,`${item.id} walkthrough too brief`);
    assert.ok(item.evidence.length>=3,`${item.id} evidence too brief`);
    assert.ok(item.reflection.length>=2,`${item.id} reflection too brief`);
    assert.ok(item.code.typescript && item.code.python,`${item.id} needs both code display tabs`);
  }
});

test('pins the slide deck and both distinct participant/reference repositories',()=>{
  assert.equal(classroomExerciseSources.slides.revision,'abde6d1b94f4065cb4ed2927b057d6f7866b3ec0');
  assert.equal(classroomExerciseSources.starter.revision,'373de89e0bcdd0ba3a0dd5c937f896b00db74ba7');
  assert.equal(classroomExerciseSources.practice.revision,'5d346dff5790712b5e04189f29e4be2da0ef724b');
  assert.notEqual(classroomExerciseSources.starter.url,classroomExerciseSources.practice.url);
});

test('day filtering is safe for unsupported days',()=>{
  assert.deepEqual(exercisesForDay(3),[]);
  assert.deepEqual(exercisesForDay('1').map(item=>item.assignment),[1,2,3,4]);
});

test("assignment slide mapping matches the pinned classroom deck",()=>{
 assert.deepEqual(classroomExercises.map(item=>item.sourceSlide),[35,37,40,41,52,55,57,61,66,69,76,81,84]);
});
