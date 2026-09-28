export const classroomExerciseSources = {
  slides: {
    title: 'AetherLink classroom slides',
    url: 'https://github.com/jyse/aetherlink-classroom-slides/tree/abde6d1b94f4065cb4ed2927b057d6f7866b3ec0',
    revision: 'abde6d1b94f4065cb4ed2927b057d6f7866b3ec0',
  },
  starter: {
    title: 'Aether Library starter',
    url: 'https://github.com/jyse/aetherlink-classroom-starter/tree/373de89e0bcdd0ba3a0dd5c937f896b00db74ba7',
    revision: '373de89e0bcdd0ba3a0dd5c937f896b00db74ba7',
  },
  practice: {
    title: 'Aether Library practice reference',
    url: 'https://github.com/jyse/aetherlink-classroom-practice/tree/5d346dff5790712b5e04189f29e4be2da0ef724b',
    revision: '5d346dff5790712b5e04189f29e4be2da0ef724b',
  },
};

const exercise = (id, day, assignment, title, slide, problem, explanation, diagram, walkthrough, tryIt, evidence, reflection, deepDive, code) => ({
  id, day, assignment, title, sourceSlide: slide, problem, explanation, diagram, walkthrough, tryIt, evidence, reflection, deepDive, code,
});

export const classroomExercises = [
  exercise('a1-repository-explorer', 1, 1, 'Repository explorer', 35,
    'You have inherited a small application. Before changing it, you need to know what it does, where its data lives, and how to check a change without breaking the learning game.',
    'Treat the repository as evidence. Ask Claude Code to inspect named files and commands, then compare its map with the files yourself. Exploration is a read-only task: a useful answer names what it found and leaves unknowns OPEN.',
    ['Question and scope', 'Read README and package scripts', 'Trace pages to data and routes', 'Report claims with file evidence'],
    ['Open README.md and package.json; record the actual start and validation commands.', 'Trace one page from public/index.html through public/app.js to its server route and JSON file.', 'Identify files with learner data or shared behavior that need care before edits.', 'Ask Claude Code for a repository map with a file path for each claim; ask it to make no changes.', 'Check each claim against the files and label anything you cannot establish OPEN.'],
    'In the starter repository, compare `package.json`, `server.js`, and `data/glossary.json`. Ask for a map of the Glossary path without changing files. Then compare with the practice reference, where Profiles, Glossary, and Library already render data.',
    ['A short app-purpose and structure map.', 'Paths for profile, glossary, and concept-card data plus the UI/server code that uses them.', 'The exact start and validation commands present in the checked-out repo.', 'A clean `git status` showing no changes caused by exploration.', 'At least one OPEN item if the files do not settle a question.'],
    ['Which claim did you verify directly in a file?', 'What did Claude infer from a filename or convention?', 'Which file would you inspect next before changing the profile page?'],
    'A repository map is a dependency trace: page → browser code → API route → data file. In the starter, `npm start` runs `server.js`; `npm run validate` validates data shapes, but the starter initially has no profiles data/route and empty glossary/card arrays. The practice reference has an implemented `/api/profiles` and populated sample data. Keep those states distinct.',
    { typescript: `// Read-only inventory sketch; run it locally only if useful.
import { readFile } from 'node:fs/promises';
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
console.log(pkg.scripts);`, python: `# Read-only inventory sketch; run it locally only if useful.
import json
from pathlib import Path
pkg = json.loads(Path('package.json').read_text())
print(pkg['scripts'])` }),
  exercise('a2-participant-profile', 1, 2, 'Participant profile', 37,
    'The Profiles destination exists in the intended app, but the starter has no profile data or working profile page. Add one useful participant entry and make it visible without exposing private details.',
    'Separate data from presentation. Inspect the current page shell and server conventions first, agree on a small plan, then add only the fields the profile needs. A file entry alone is not done; the browser must load and render it.',
    ['Participant-approved details', 'data/profiles.json', 'GET /api/profiles', 'Profiles page', 'Validate + browser review'],
    ['Choose shareable values for name, role, team, experience, learning goal, and one workflow to improve; omit confidential details.', 'Inspect the starter server routes, page markup, and data-loading pattern; propose the smallest implementation plan.', 'Review the plan before any edit. Add the profile using the repository’s existing JSON conventions.', 'Implement the Profiles route and page only as needed for the profile to render.', 'Run the repo’s validation command and inspect the Profiles page in the browser; review the diff for unrelated changes.'],
    'Use the practice repo’s `data/profiles.json` and Profiles UI as a shape/reference example. Build your own version in the starter; don’t copy the reference person’s personal details.',
    ['One appropriate profile object in `data/profiles.json`.', 'Profiles route returns the data and the browser displays it.', 'Validation output from the exact command you ran.', 'Diff reviewed; no unrelated files changed; plan approved before edits.'],
    ['Which fields are useful to classmates, and which would be unnecessary personal data?', 'What evidence proves the page used your file rather than hard-coded text?', 'What would you mark OPEN if the UI is visible but the route behavior is unclear?'],
    'The practice reference has an implemented profile schema with required strings `name`, `role`, `experience`, `learningGoal`, and `workflowToImprove`; `team` is also part of the class profile. The starter validator’s profile schema is intentionally narrower, and the starter begins without the profiles endpoint. Inspect the local starter before relying on the reference behavior.',
    { typescript: `type Profile = {
  name: string; role: string; team: string;
  experience: string; learningGoal: string;
  workflowToImprove: string;
};`, python: `profile = {
    "name": "Your chosen name",
    "role": "Your role",
    "team": "Your team",
    "experience": "Relevant experience",
    "learningGoal": "What you want to learn",
    "workflowToImprove": "A workflow to improve",
}` }),
  exercise('a3-glossary-contribution', 1, 3, 'Glossary contribution', 40,
    'The starter has a working data endpoint but no Glossary page and starts with an empty glossary. Add one plain-language AI term that helps a newcomer understand agentic work.',
    'Choose a term that is absent, then draft a concise definition before editing. Check the claim against a reliable source and match the existing `term`/`definition` shape. A useful contribution is visible in the app, not just valid JSON.',
    ['Choose a missing term', 'Draft + source-check', 'Add glossary JSON entry', 'Build the page if needed', 'Validate and inspect'],
    ['Read `data/glossary.json` and inspect the current app; confirm your term is not already present.', 'Write a one- or two-sentence definition for someone new to agentic AI and identify a trustworthy source.', 'Show the draft and the smallest plan; resolve unsupported wording before editing.', 'Add the entry following the existing shape. If the Glossary page is still a placeholder, implement only enough UI to display the entries.', 'Run `npm run validate` and inspect the rendered entry in the browser.'],
    'In the starter, start with an empty array in `data/glossary.json`. Compare the practice reference’s richer examples to understand tone and JSON shape, then write an original term and definition.',
    ['A new `term` and `definition` entry.', 'A source that supports the important factual claim.', 'Validation output and a browser view of the Glossary entry.', 'Draft reviewed before editing.'],
    ['Could a newcomer explain the term after reading this definition?', 'Which phrase is directly supported by the source?', 'What did you leave out to keep this definition short?'],
    'The starter validator checks required fields in each entry and permits an empty top-level array; the populated practice reference has stricter non-empty expectations. It does not establish factual accuracy, source quality, uniqueness, or whether the browser renders the entry. Those need human review and a real browser check.',
    { typescript: `type GlossaryEntry = {
  term: string;
  definition: string;
};
const entry: GlossaryEntry = {
  term: 'Choose a term',
  definition: 'Explain it in plain language.'
};`, python: `entry = {
    "term": "Choose a term",
    "definition": "Explain it in plain language."
}` }),
  exercise('a4-enriched-concept-card', 1, 4, 'Enriched concept card', 41,
    'A glossary definition is not enough for someone who needs to use a concept. Expand one glossary term into a sourced card that gives explanation, example, caveat, key points, related concepts, and reliable resources.',
    'A concept card is a structured learning artifact. Inspect the sample card and validator, gather and read primary sources, then draft every field. Keep unsupported details OPEN. Approve the content and plan before writing, validate the record, and check it in the Library.',
    ['Glossary term', 'Read reliable sources', 'Draft exact card fields', 'Human approval', 'Write → validate → browser'],
    ['Choose a glossary entry with enough source material; inspect the sample `Context window` card and `scripts/validate.js`.', 'Read the linked sources themselves. Record which source supports each important factual point.', 'Draft explanation, example, common misunderstanding, essential points, related concepts, and resources.', 'Ask Claude Code to show the draft and minimal plan. Approve or revise before it edits `data/concept-cards.json`.', 'Run `npm run validate`, inspect the Library card in the browser, and ask a peer to check source-to-claim alignment.'],
    'Use the practice repo’s populated Context window card to study the exact field shape. In the starter, add one new card for your glossary term and make the Library display it.',
    ['A complete card with all required fields and non-empty lists.', 'Real sources read and linked to factual claims.', 'Validator output plus a working Library view.', 'A peer decision: PASS, REVISE, or OPEN with one reason.'],
    ['Which sentence has the strongest source support?', 'What common misunderstanding did your card correct?', 'Which missing detail stayed OPEN instead of being filled by guesswork?'],
    'The practice validator requires `term`, `explanation`, `example`, `commonMisunderstanding`, non-empty `essentialPoints`, `relatedConcepts`, and `resources` with `label`/`url`. Passing validation proves shape only. Human approval and checking the rendered UI prove other parts of the result.',
    { typescript: `type Resource = { label: string; url: string };
type ConceptCard = {
  term: string; explanation: string; example: string;
  commonMisunderstanding: string;
  essentialPoints: string[]; relatedConcepts: string[];
  resources: Resource[];
};`, python: `card = {
    "term": "Term",
    "explanation": "Plain-language explanation",
    "example": "Practical example",
    "commonMisunderstanding": "A misconception",
    "essentialPoints": ["Key point"],
    "relatedConcepts": ["Related term"],
    "resources": [{"label": "Official source", "url": "https://example.com"}],
}` }),
  exercise('a5-design-library', 2, 5, 'Design your Library', 50,
    'The starter has a shared visual system and a light/dark switch. Make the Library and AetherBOT feel intentional and personal while preserving readability and working navigation.',
    'Start with design choices, not CSS edits. Name the mood, colors, typography, and bot voice; inspect how the current theme is stored and applied. Then plan a third palette that survives reload, restyle the Library and bot, and verify contrast and every route in the browser.',
    ['Describe look and voice', 'Inspect theme + styles', 'Plan three palettes', 'Implement and persist', 'Review every page'],
    ['Write a short design brief with mood, three palettes, fonts/shapes, and AetherBOT’s appearance and voice.', 'Inspect `public/style.css`, `public/app.js`, and the current theme toggle; identify the current storage key and selectors.', 'Ask Claude Code for a minimal plan before editing. Keep content/data files out of the styling change.', 'Add a third theme alongside the existing light/dark themes and persist the selection across reload; restyle Library and bot elements.', 'Cycle all themes, reload, test all four pages, and have a neighbor check contrast/readability and navigation.'],
    'Compare the starter’s two-theme toggle with the practice reference’s current implementation. The assignment extends the starter; don’t assume the reference already has the required three palettes.',
    ['A written mood/color/type/bot-voice brief.', 'A third palette selectable alongside light and dark and still selected after reload.', 'AetherBOT and Library styling visibly reflect the brief.', 'Browser evidence for legibility and working Profiles, Glossary, Library, and Game pages.'],
    ['Which design choice helps people scan a concept card?', 'Did persistence survive a full reload?', 'Which page or state was hardest to check for contrast?'],
    'The theme toggle stores a value in `localStorage` and applies it through a root `data-theme` attribute. A third theme requires coordinated CSS tokens and selection logic; changing the button alone does not create a usable palette. Keep contrast checks across text, controls, and feedback states.',
    { typescript: `type Theme = 'light' | 'dark' | 'brand';
function saveTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('academy-practice-theme', theme);
}`, python: `# UI concept only; the app's theme is changed in browser JavaScript.
THEMES = ('light', 'dark', 'brand')
# Check that each palette keeps text and controls readable.` }),
  exercise('a6-project-instructions', 2, 6, 'Project instructions', 55,
    'Every new Claude Code session should understand what AetherBOT does, where its answers come from, and the boundaries it must follow—without you repeating those rules.',
    'Put stable project guidance in `CLAUDE.md`, not a one-day task list. Explore the existing bot and file first, then propose the smallest durable instructions: purpose, trusted sources, at least three behavior rules, test command, and approval point.',
    ['Inspect bot and current CLAUDE.md', 'Choose durable rules', 'Draft minimal instructions', 'Review before edit', 'Prove in fresh session'],
    ['Trace how AetherBOT loads glossary/cards and how the current bot responds.', 'Choose at least three rules in your own words; include how to handle uncertainty and private profile information.', 'Ask for a concise CLAUDE.md update covering bot purpose, answer sources, rules, how to test, and when Claude must pause for approval.', 'Review the proposed diff and remove temporary assignment notes or personal details before approving.', 'Start a fresh Claude Code session (or clear the conversation) and ask what rules it sees; compare the answer with the file.'],
    'The practice repo’s CLAUDE.md is intentionally minimal and its bot uses local glossary/card data. Update the starter’s own instructions and verify them in a fresh session rather than copying the finished file wholesale.',
    ['A small CLAUDE.md with at least three operational rules.', 'Rules identify trusted answer data and say OPEN when evidence is missing.', 'Test command and human approval boundary are explicit.', 'Fresh-session answers match the written rules.'],
    ['Which rule will remain useful after this workshop?', 'Could Claude follow it without verbal context?', 'Did you accidentally include a temporary task or personal preference?'],
    '`CLAUDE.md` is persistent context for Claude Code, not a security boundary and not AetherBOT’s runtime code. A rule written there influences Claude’s development work; Assignment 7 separately changes the bot implementation so the built app follows the intended behavior.',
    { typescript: `// Persistent instruction outline (content, not executable code)
const sections = [
  'Purpose and trusted data',
  'Behavior rules and uncertainty',
  'How to verify changes',
  'When to stop for approval'
];`, python: `# Persistent instruction outline (content, not executable code)
sections = [
    "Purpose and trusted data",
    "Behavior rules and uncertainty",
    "How to verify changes",
    "When to stop for approval",
]` }),
  exercise('a7-build-bot-from-rules', 2, 7, 'Build AetherBOT from your rules', 57,
    'AetherBOT is ordinary application code with no model inside. Implement one or two useful commands and make their behavior match the rules in CLAUDE.md without pasting those rules into your task prompt.',
    'This assignment checks whether persistent guidance is sufficient to produce observable runtime behavior. Ask for a plan, implement a small change, and test both expected and boundary questions. If a rule fails, determine whether the implementation or the written rule needs repair.',
    ['CLAUDE.md rules', 'Plan a small bot change', 'Implement 1–2 commands', 'Test allowed + boundary cases', 'Review code or rule'],
    ['Start a fresh request without repeating the rules; ask Claude Code to make the bot follow CLAUDE.md.', 'Choose one or two commands such as “quiz me” or “compare X and Y”; agree on a plan before edits.', 'Implement the commands using only the app’s glossary/concept-card data.', 'Test a known term, an unknown term, an off-topic question, a profile-related question, and tricky wording.', 'Review each failure: is the code inconsistent with a clear rule, or is the rule itself ambiguous? Fix and rerun.'],
    'Use `data/glossary.json` and `data/concept-cards.json` as the bot’s local knowledge boundary. Try a known term and a term absent from both; the latter should trigger the chosen uncertainty rule.',
    ['One or two commands work from the UI.', 'Known-term responses cite or reveal the supporting local card.', 'Unknown, off-topic, and profile prompts follow explicit rules.', 'Fresh-session use did not rely on repeating rules in the prompt.'],
    ['Which test exposed a mismatch between code and CLAUDE.md?', 'Did the bot answer from an actual source file?', 'What did you change: the implementation, the rule, or both?'],
    'Keep the distinction clear: Claude Code is the coding assistant; AetherBOT is the static/local app being built. The bot does not call an AI model. Boundary behavior should be implemented in application logic and verified through visible test cases, not assumed from CLAUDE.md alone.',
    { typescript: `function answer(term: string, cards: Map<string, string>) {
  const card = cards.get(term.toLowerCase());
  return card ? { status: 'FOUND', source: term, answer: card }
              : { status: 'OPEN', source: null, answer: null };
}`, python: `def answer(term, cards):
    card = cards.get(term.casefold())
    if card:
        return {"status": "FOUND", "source": term, "answer": card}
    return {"status": "OPEN", "source": None, "answer": None}` }),
  exercise('a8-create-second-card', 2, 8, 'Create a second card', 61,
    'You already have one approved concept card. Create a second card with a normal one-off task brief and notice which requirements you have to repeat before a reusable skill exists.',
    'Repeat the same quality bar deliberately: source-backed claims, exact card structure, review before writing, validation, and a Library check. Capture the instructions you repeated; that list becomes the raw material for Assignment 9.',
    ['Approved first card', 'Choose another glossary term', 'Repeat brief + checks', 'Review before write', 'Compare both runs'],
    ['Choose a different term; add a glossary definition first if needed.', 'Use the same requirements and validation approach as yesterday’s approved card; do not invoke a skill yet.', 'Ask Claude Code to show the card draft and implementation plan, and approve them before edits.', 'Validate the data and confirm the second card renders on the existing Library page.', 'Write down every instruction you had to repeat and compare structure, sources, and checks with card one.'],
    'Use the practice repo’s Context window card as a reference for shape and the starter’s empty card collection as your workspace. Record repeated instructions rather than automating them yet.',
    ['A second complete card renders in the Library.', 'Validation and source checks are recorded.', 'A short list of repeated instructions from the one-off prompt.', 'Both card runs are compared for consistency.'],
    ['Which requirement did you forget until prompted?', 'Where did the two cards differ?', 'Which repeated step should become a skill, and which decision still needs human judgment?'],
    'This assignment is intentionally ad hoc. A skill would hide the repetition you need to notice. The practice repo’s validator covers field shape, while sources and consistent judgment still require a human review.',
    { typescript: `// Compare required fields across two cards.
const required = ['explanation', 'example', 'commonMisunderstanding'];
const missing = card => required.filter(key => !card[key]);`, python: `# Compare required fields across two cards.
required = ["explanation", "example", "commonMisunderstanding"]
missing = [key for key in required if not card.get(key)]` }),
  exercise('a9-create-card-skill', 2, 9, 'Teach Claude the method', 66,
    'You have repeated the concept-card method. Package the reusable parts as `.claude/skills/create-concept-card/SKILL.md`, while keeping source judgment and final approval visible to a person.',
    'A good skill names when it applies, input, exact output shape, steps, validation, boundaries, and stop conditions. Use approved cards as examples. Require read sources, keep uncertainty OPEN, and restrict writes to the concept-card file after explicit approval.',
    ['Approved card examples', 'Reusable procedure', 'Skill file + boundaries', 'Test against known card', 'Human approval gate'],
    ['Inspect approved cards and the validator to extract the stable method.', 'Draft the skill in `.claude/skills/create-concept-card/SKILL.md` with inputs, procedure, output fields, checks, and stop conditions.', 'Require real sources for facts; prohibit invention; mark insufficient source material OPEN.', 'State that approval is required before writing and that writes are limited to `data/concept-cards.json`—never profiles or glossary as a side effect.', 'Test the skill against an approved card and review the result against the original.'],
    'Use the practice reference card and `scripts/validate.js` to infer the exact output shape. Build the skill in the starter and check its allowed file boundary before trying it.',
    ['A skill at the required path.', 'Exact concept-card field requirements and source-check process.', 'OPEN behavior for insufficient evidence.', 'Explicit validation and human-approval stop.', 'Test result against a known approved card; no out-of-scope files changed.'],
    ['Which instruction prevents the skill from inventing a source?', 'Where does the skill stop and hand judgment to you?', 'How would a fresh session discover the skill?'],
    'A Claude Code skill is a reusable method invoked when relevant; it does not start Claude Code or run continuously. Keep the skill’s general procedure separate from checklist/content data, and use file boundaries to make side effects easy to review.',
    { typescript: `type SkillContract = {
  input: 'one glossary term';
  output: 'ConceptCard draft';
  mayWrite: ['data/concept-cards.json'];
  stopWhen: ['sources insufficient', 'approval missing'];
};`, python: `skill_contract = {
    "input": "one glossary term",
    "output": "ConceptCard draft",
    "may_write": ["data/concept-cards.json"],
    "stop_when": ["sources insufficient", "approval missing"],
}` }),
  exercise('a10-build-card-library', 2, 10, 'Build the card library', 69,
    'Process suitable glossary terms with one approved method. The batch can contain good candidates, incomplete sources, and terms that should not receive a card; continue safely without hiding per-term status.',
    'This is bounded multi-step work: define the set, handle one term at a time, validate each draft, record READY/REVISE/OPEN, and stop when input is insufficient or approval is needed. Do not commit. The report must let a person decide each card separately.',
    ['Approved skill + term list', 'Read one term and source', 'Draft + validate', 'READY / REVISE / OPEN', 'Repeat or stop for review'],
    ['Add four glossary terms as definitions only, as the assignment specifies; check that each has sufficient source material.', 'Ask Claude Code to process each remaining approved term one at a time with the create-concept-card skill.', 'For every term, record source sufficiency, validation result, and READY/REVISE/OPEN status.', 'Never invent missing material; pause on OPEN items and never commit.', 'Review every card individually and request one final report covering the full term set.'],
    'Use `npm run validate` and the validator’s targeted file/schema form to inspect shape behavior. Treat fixture failure as expected only when running `validate:fixtures`; don’t mistake that demonstration for your card batch.',
    ['Draft cards for suitable terms only.', 'A per-term status report with source and validation evidence.', 'OPEN/REVISE items visibly separated for human decision.', 'No commit and no edits outside the permitted card file (plus the four intentionally added glossary entries).'],
    ['Which term had insufficient evidence?', 'Did each READY label have an observed validation result?', 'What decision did you retain for human review instead of delegating?'],
    'The practice validator provides shape checks, not source validation. A reliable batch loop must keep one item’s evidence and status attached to that item, stop at missing information, and avoid claiming every term is ready because the overall command passed.',
    { typescript: `type Status = 'READY' | 'REVISE' | 'OPEN';
type TermResult = {
  term: string; sourcesSufficient: boolean;
  validationPassed: boolean; status: Status;
};`, python: `from typing import Literal
Status = Literal["READY", "REVISE", "OPEN"]
result = {
    "term": "A term",
    "sources_sufficient": False,
    "validation_passed": False,
    "status": "OPEN",
}` }),
  exercise('a11-learning-game', 2, 11, 'Learning game and local feedback', 76,
    'The starter game already accepts an explanation, stores one latest submission, and has a feedback area. Build the criteria and local checking skill around it; do not rebuild the game or add a server-side model/API call.',
    'Separate policy from mechanism. First agree a checklist based on approved cards; then build a generic term-checker that reads the checklist and latest submission, compares with the matching card (or glossary entry), and writes structured feedback. The participant’s authenticated local Claude Code session performs the check using files.',
    ['Learner submits answer', 'Local latest-submission.json', 'Claude Code reads checklist + source card', 'Local latest-feedback.json', 'Learner checks feedback'],
    ['Use existing approved cards to propose criteria: meaning, essential points, example, inaccurate claims, missing information, and relevant resources. Agree the four rating categories and write the approved criteria to `checklist.md`.', 'Create `.claude/skills/term-checker/SKILL.md`; make it read `checklist.md` generically rather than hard-code today’s rules.', 'Require comparison with the matching card, or glossary entry if no card exists; write structured feedback to the expected local file.', 'Keep the flow local: no external model/API, API key, or database. Do not rebuild the working game.', 'Submit one answer in the app, ask your own Claude Code session to check it, then use Check feedback. Also check empty and incomplete-answer states.'],
    'The starter and practice repos both document the local file bridge. One example instruction is: “Check my latest submission using the term-checker skill.” Code examples below only illustrate the file contract; Claude Code does the review in the participant’s own session.',
    ['An approved `checklist.md` with criteria and four result categories.', 'A generic term-checker skill that reads the latest submission and matching source.', 'A real feedback file created by the participant’s own Claude Code session.', 'The app displays the feedback; no credentials or external model call are involved.', 'An early Check feedback click has a clear waiting/empty state.'],
    ['Could the skill follow a changed checklist without being rewritten?', 'What evidence supports the feedback category?', 'How does the app behave before feedback exists?', 'Which step was performed locally by Claude Code?'],
    'This design has two separate processes: the web app records the submission and reads feedback; Claude Code reads local files and writes feedback. The app’s server never calls an LLM. New submissions overwrite the single latest slot and clear stale feedback, so feedback is tied to the current answer.',
    { typescript: `type Submission = { term: string; answer: string };
type Feedback = {
  rating: string; whatWasUnderstood: string;
  missingElements: string[]; incorrectClaims: string[];
  recommendedResources: string[]; note?: string;
};`, python: `submission = {"term": "Context window", "answer": "My own explanation"}
feedback = {
    "rating": "Partially complete",
    "whatWasUnderstood": "The core idea is present.",
    "missingElements": [], "incorrectClaims": [],
    "recommendedResources": [],
}` }),
  exercise('a12-connected-context', 2, 12, 'Connected context', 81,
    'Use one approved workplace connection to understand one authorised Jira ticket, GitLab issue/merge request, or Confluence page. Access is read-only for this task; the repository itself does not require MCP.',
    'Ask for one item and evidence from its fields. Explain what you retrieved in plain language, record what remains unclear, and name actions the connection could perform that you did not approve. Never modify the external system. Use the approved connection instructions and stop if access or scope is unclear.',
    ['Approved MCP connection', 'Select one authorised item', 'Read only the needed fields', 'Explain with evidence + OPEN', 'No write action'],
    ['Confirm the organisation-approved MCP connection in Claude Code; do not paste credentials into the repository or lesson.', 'Choose exactly one authorised ticket, issue/MR, or page and explicitly ask for read-only retrieval.', 'Record the source identifier and the fields that support each statement.', 'Summarise in plain language and mark missing or ambiguous details OPEN.', 'List available write actions that were not approved; verify there were no external changes.'],
    'If the approved connection is unavailable, use only the facilitator-provided fictional fixture/demo for practice and label it as a fixture. Do not substitute repository APIs or invent live MCP access.',
    ['One source identifier and the fields read.', 'A concise sourced explanation.', 'OPEN items for uncertainty.', 'Explicit no-change statement and actions not approved.', 'No credentials or sensitive external content copied into the repo.'],
    ['Which field supports your main conclusion?', 'What remains uncertain from this item alone?', 'What capability did you deliberately leave unused?'],
    'MCP provides a connection surface; it does not grant blanket permission or transfer human responsibility. The classroom deck treats Jira/GitLab/Confluence as the intended live path. This assignment’s read-only boundary applies even if a tool exposes write operations.',
    { typescript: `type ReadOnlyFinding = {
  source: string;
  fields: string[];
  summary: string;
  openQuestions: string[];
  writesPerformed: 0;
};`, python: `finding = {
    "source": "one authorised item ID",
    "fields": ["status", "assignee", "updated"],
    "summary": "Plain-language, field-backed summary",
    "open_questions": ["What is still unclear?"],
    "writes_performed": 0,
}` }),
  exercise('a13-day-start-workflow', 2, 13, 'Day-start workflow', 84,
    'Turn separate reusable methods into a predictable start-of-day workflow that fetches Jira context, sorts it, and prepares a brief while keeping all ticket actions read-only and a human in control.',
    'A skill packages one method; a workflow orders several methods and tools. Define the trigger, fixed sequence, output, error/OPEN behavior, and human checkpoint. Test in a fresh Claude Code session on the participant’s own authorised tickets, then let a partner inspect or copy the files and run them on their own access.',
    ['Trigger: “Start my day”', 'Fetch tickets (read-only)', 'Sort by useful categories', 'Draft brief + OPEN items', 'Human checkpoint; no ticket edits'],
    ['Use the approved `/mcp` setup to confirm Jira access; request an open-ticket list read-only.', 'Design a workflow from two or three skills (fetch, sort, brief); show the order and failure behavior before building.', 'Build the skills and an entry point that runs them in a fixed order, with a human checkpoint before any action.', 'Start a fresh Claude Code session and run the trigger “Start my day.” Check the source items and category assignments.', 'Share only the reusable skill files; the partner runs them with their own authorised Jira connection. Do not expose tickets or credentials.'],
    'Keep the workflow entirely read-only. A useful brief groups new, blocked, due soon, and waiting-for-you items, then proposes priorities while leaving decisions with the participant.',
    ['Two or three named skills run in a fixed sequence.', 'A fresh-session test with source-backed output.', 'Unclear cases are marked OPEN and no ticket was modified.', 'A human checkpoint is explicit.', 'Partner can understand the method without receiving your credentials or private ticket contents.'],
    ['Which step is a reusable skill and which part is orchestration?', 'Where does the workflow pause for a human?', 'What does it do if Jira is unavailable or a ticket is ambiguous?'],
    'A workflow is not merely multiple prompts in one transcript. Its trigger, ordering, inputs, outputs, error paths, and stop conditions should be inspectable and repeatable. The MCP tool remains read-only for this assignment; a fresh-session run demonstrates durable files rather than conversational memory.',
    { typescript: `type WorkflowStep = 'fetch' | 'sort' | 'brief';
const dayStart: WorkflowStep[] = ['fetch', 'sort', 'brief'];
const boundary = 'read-only; pause for human decisions';`, python: `steps = ["fetch", "sort", "brief"]
boundary = "read-only; pause for human decisions"
# Run from a fresh Claude Code session and inspect the output.` }),
];

export function exercisesForDay(day) {
  return classroomExercises.filter(item => item.day === Number(day));
}
