import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join, dirname} from "node:path";
import {fileURLToPath} from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const en = JSON.parse(readFileSync(join(root, "src/i18n/en.json"), "utf8"));
const nl = JSON.parse(readFileSync(join(root, "src/i18n/nl.json"), "utf8"));
const panels = readFileSync(join(root, "src/panels.jsx"), "utf8");
const arcade = readFileSync(join(root, "src/arcade/ArcadeApp.jsx"), "utf8");
const deck = readFileSync(join(root, "packages/deck/src/Deck.tsx"), "utf8");
const fw = readFileSync(join(root, "src/facilitator-workspace.jsx"), "utf8");
const css = readFileSync(join(root, "src/facilitator-workspace.css"), "utf8");

test("AET-134 i18n key parity EN+NL for new chrome", () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(nl).sort());
  for (const key of [
    "path.pedagogyLabel",
    "path.assignmentsCrosslink",
    "path.openAssignments",
    "path.assignmentsSoT",
    "path.checklistLabel",
    "simple.deck",
    "simple.dayPack",
    "arcade.starters.ready",
    "arcade.starters.htmlSolo",
    "arcade.starters.instructions",
    "arcade.demoOnly",
  ]) {
    assert.equal(typeof en[key], "string", key);
    assert.equal(typeof nl[key], "string", key);
    assert.notEqual(nl[key], "", key);
  }
  // NL Coach+Arcade chrome must not equal EN for translated labels
  assert.notEqual(nl["arcade.card.sdk.title"], en["arcade.card.sdk.title"]);
  assert.notEqual(nl["arcade.hub.facilitatorNotes"], en["arcade.hub.facilitatorNotes"]);
  assert.notEqual(nl["coach.ctx.repo"], "Repository review");
});

test("AET-134 Path = pedagogy; Assignments = Done-when SoT", () => {
  const overview = panels.split("currentStep.id==='overview'&&")[1]?.split("currentStep.id==='idea'&&")[0] || "";
  assert.match(overview, /data-testid="path-pedagogy"/);
  assert.match(overview, /data-testid="path-assignments-crosslink"/);
  assert.match(panels, /assignments-sot-hint/);
  assert.match(panels, /lessonPages\.flowLabel/);
  assert.match(panels, /path\.assignmentsSoT/);
  // Lesson Path keeps one task-count CTA without duplicating the Assignment checklist.
  assert.match(panels, /lessonPages\.taskSummary/);
  assert.match(panels, /lessonPages\.openAssignment/);
  assert.doesNotMatch(overview, /ProgressivePath/);
  // Assignments C1/C2 render full ProgressivePath then ClassroomExercises
  assert.match(panels, /assignments-sot-hint[\s\S]*ProgressivePath steps=\{pack\.steps\}\/>[\s\S]*ClassroomExercises/);
});

test("AET-134 Arcade starters chrome uses i18n (no EN hardcode under nl)", () => {
  assert.match(arcade, /arcade\.starters\.ready/);
  assert.match(arcade, /arcade\.starters\.htmlSolo/);
  assert.match(arcade, /arcade\.starters\.openRepo/);
  assert.doesNotMatch(arcade, /<strong>SDK-starters klaar<\/strong>/);
  assert.doesNotMatch(arcade, />open repo </);
});

test("AET-134 W4 deck companions strip + facilitator deck/day-pack toggle + drawer width", () => {
  assert.match(deck, /deck-companions/);
  assert.match(deck, /companions/);
  assert.match(fw, /simple\.deck/);
  assert.match(fw, /simple\.dayPack/);
  assert.match(fw, /data-surface/);
  assert.match(css, /clamp\(300px,28vw,400px\)/);
});
