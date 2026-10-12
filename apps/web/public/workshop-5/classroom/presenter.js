'use strict';
/* ==========================================================================
   Presenter view — a separate window/tab kept in sync with the main deck.
   Sync channel: BroadcastChannel('aetherlink-classroom-slides'), same name
   the main app.js broadcasts on. Falls back to a localStorage 'storage'
   event for browsers without BroadcastChannel (older Safari/WebViews).
   Shows: a live preview of the current and next slide (index.html?embed=1 in
   an iframe), keyword bullets (keyPoints) above the full notes text, and the
   same timer as the deck (timers.js, shared through localStorage).
   ========================================================================== */
const slides = window.SLIDES || [];
const DECK_ID = window.DECK_PAGE || 'index.html';
const PRESENTER_CHANNEL = 'aetherlink-classroom-slides:' + DECK_ID;
const PRESENTER_KEY = 'als:presenter:index:' + DECK_ID;
const HIDDEN_KEY = 'als:hidden:' + DECK_ID;
const SHOWN_KEY = 'als:shown:' + DECK_ID;
const $ = id => document.getElementById(id);

let current = 0;
const startedAt = Date.now();
let timerController = null;

function setSyncStatus(live) {
  $('sync-status').classList.toggle('live', live);
  $('sync-label').textContent = live ? 'Live — following the main window' : 'Waiting for the main window…';
}

function renderElapsed() { $('elapsed').textContent = ALSTimer.fmt(Math.floor((Date.now() - startedAt) / 1000)); }
setInterval(renderElapsed, 1000);
renderElapsed();

/* ---- slide previews: the real deck in an iframe, scaled to fit ---- */
function fitShot(shot) { const f = shot.querySelector('iframe'); f.style.transform = 'scale(' + (shot.clientWidth / 1600) + ')'; }
function showInFrame(frame, index) {
  if (index == null) { frame.parentElement.hidden = true; return; }
  frame.parentElement.hidden = false;
  const hash = '#' + (index + 1);
  // once the deck has loaded inside the frame, only change its hash (no reload); before that, (re)load it
  try { if (frame.dataset.ready) { frame.contentWindow.location.hash = hash; return; } } catch {}
  frame.src = (window.DECK_PAGE || 'index.html') + '?embed=1' + hash;
}
[$('p-frame'), $('p-next-frame')].forEach(f => f.addEventListener('load', () => { f.dataset.ready = '1'; }));
const ro = new ResizeObserver(entries => entries.forEach(e => fitShot(e.target)));
[$('p-shot'), $('p-next-shot')].forEach(el => ro.observe(el));

function isHidden(i) {
  const id = i + ':' + slides[i].title; const list = k => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };
  return slides[i].hidden ? !list(SHOWN_KEY).includes(id) : list(HIDDEN_KEY).includes(id);
}

/* ---- the timer for this slide, if it has one (assignment, break or quiet timer) ---- */
function setupTimer(s) {
  timerController?.abort(); timerController = new AbortController();
  const slot = $('p-timer-slot'); slot.replaceChildren();
  const v = s.visual || {}; const key = ALSTimer.key(current, s.title); let box = null, label = '';
  if (s.layout === 'exercise') { label = 'This assignment'; box = ALSTimer.mount({ key, defaultSec: 0, minutes: true, bar: true, doneText: 'TIME', signal: timerController.signal }); }
  else if (v.countdown) { label = 'Break'; box = ALSTimer.mount({ key, defaultSec: v.countdown * 60, back: true, boxCls: 'pause-box', faceCls: 'pause-clock', lateCls: 'late', signal: timerController.signal }); }
  else if (v.quietTimer) { label = 'Quiet time'; box = ALSTimer.mount({ key, defaultSec: v.quietTimer * 60, boxCls: 'pause-box quiet', faceCls: 'pause-clock', lateCls: 'late', lateAt: 30, signal: timerController.signal }); }
  $('p-timer').hidden = !box; $('p-timer-label').textContent = label; if (box) slot.append(box);
}

function renderSlide(index) {
  if (!Number.isInteger(index) || index < 0 || index >= slides.length) return;
  current = index;
  const s = slides[current];
  const type = s.type || (s.layout === 'exercise' ? 'practice' : s.layout === 'recap' ? 'recap' : 'context');
  const TYPE_LABEL = { practice: 'Assignment', concept: 'Concept', review: 'Review', quiz: 'Quiz', recap: 'Recap', pause: 'Break', context: 'Context' };
  $('ptype-wrap').dataset.ptype = type;
  $('p-type-label').textContent = TYPE_LABEL[type] || 'Context';
  $('p-kicker-text').textContent = s.kicker || '';
  $('p-progress').textContent = (current + 1) + ' / ' + slides.length;
  $('p-hidden').hidden = !isHidden(current);
  $('p-title').textContent = s.title;
  const keys = s.keyPoints || [];
  $('p-keys-block').hidden = !keys.length;
  $('p-keys').replaceChildren(...keys.map(k => { const li = document.createElement('li'); li.textContent = k; return li; }));
  $('p-notes').textContent = s.notes || 'No facilitator notes on this slide.';
  $('p-notes').classList.toggle('p-empty', !s.notes);
  const promptBlock = $('p-prompt-block');
  if (s.prompt) { promptBlock.hidden = false; $('p-prompt').textContent = s.prompt; } else { promptBlock.hidden = true; }
  const nextIndex = current + 1 < slides.length ? current + 1 : null;
  $('p-next-title').textContent = nextIndex != null ? (nextIndex + 1) + '. ' + slides[nextIndex].title : 'This is the last slide.';
  showInFrame($('p-frame'), current);
  showInFrame($('p-next-frame'), nextIndex);
  setupTimer(s);
}

/* ---- sync ---- */
let channel = null;
try { if ('BroadcastChannel' in window) channel = new BroadcastChannel(PRESENTER_CHANNEL); } catch {}
if (channel) {
  channel.addEventListener('message', e => { if (e.data && e.data.type === 'slide') { setSyncStatus(true); renderSlide(e.data.index); } });
}
window.addEventListener('storage', e => {
  if (e.key === HIDDEN_KEY || e.key === SHOWN_KEY) { $('p-hidden').hidden = !isHidden(current); return; }
  if (e.key !== PRESENTER_KEY || !e.newValue) return;
  try { const data = JSON.parse(e.newValue); setSyncStatus(true); renderSlide(data.index); } catch {}
});

/* ---- initial paint: URL param, then whatever localStorage already has ---- */
(function init() {
  const params = new URLSearchParams(location.search);
  const fromUrl = Number(params.get('i'));
  if (Number.isInteger(fromUrl) && fromUrl >= 0 && fromUrl < slides.length) { renderSlide(fromUrl); }
  try {
    const stored = JSON.parse(localStorage.getItem(PRESENTER_KEY) || 'null');
    if (stored && Number.isInteger(stored.index)) { renderSlide(stored.index); if (Date.now() - (stored.at || 0) < 15000) setSyncStatus(true); }
  } catch {}
  if (!slides.length) { $('p-title').textContent = 'slides.js did not load.'; }
})();
