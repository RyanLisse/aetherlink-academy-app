// @ts-nocheck — DOM app ported from aetherlab monolith; typed surface is fold/schema/lessons.
import { applyOp, cloneFiles, diffOp, evaluateAssert } from "../fold";
import type { Lesson } from "../schema";
import {
  DEFAULT_LESSON_ID,
  LESSONS as BUILTIN_LESSONS,
  getLesson,
  resolveLessonId,
} from "../lessons";


'use strict';
/* ────────────────────────────────────────────────────────────────
   Aetherlab v2 — event-sourced code screencasts with checkpoints.

   Lesson = { id, title, kind: 'web'|'trace', files: [{name,text}], ops, duration, audio? }
   Op (all carry t in ms):
     {f,p,d,i}     text splice in file f      {c}            caret position
     {tab}         switch file                {say}          narration caption
     {out, cls}    trace line (cls: cmd|you|tool|res|ans|err|ok|dim)
     {clear}       clear trace                {chapter}      chapter marker
     {stop:{title,q,options?,correct?,explain}}   pause for a prediction/quiz
   Playback is a fold over ops from the initial state; seeking replays.
   ──────────────────────────────────────────────────────────────── */

const STORE_KEY = 'aetherlab.lessons.v2';
const $ = id => document.getElementById(id);

const store = {
  load() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; } },
  save(list) { try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; } catch { return false; } },
};

/* text ops: imported from fold */
/* ── Highlighting ──────────────────────────────────────────────── */
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const wrap = (cls, s) => `<span class="${cls}">${esc(s)}</span>`;
const KW = 'const|let|var|function|return|if|else|for|while|of|in|new|class|import|export|from|await|async|document|window|null|true|false|this|type|interface|as|throw|try|catch|default|typeof|keyof|extends|def|None|True|False|elif|not|and|or|is|with|print';
const lang = {
  css: s => s.replace(/(\/\*[\s\S]*?\*\/)|([^{}\n;]+)(?=\s*\{)|([\w-]+)(?=\s*:)|(:[^;{}]+)|(\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms)?)/g,
    (m, cm, sel, prop, val, num) => cm ? wrap('tk-cm', cm) : sel ? wrap('tk-sel', sel) : prop ? wrap('tk-prop', prop) : val ? ':' + wrap('tk-str', val.slice(1)) : num ? wrap('tk-num', num) : esc(m)),
  js: s => s.replace(new RegExp(`(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)|("(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)|\\b(${KW})\\b|\\b(\\d+(?:\\.\\d+)?)\\b|([^\\w\\s"'\`/]+|\\w+|\\s+|.)`, 'g'),
    (m, cm, str, kw, num, rest) => cm ? wrap('tk-cm', cm) : str ? wrap('tk-str', str) : kw ? wrap('tk-kw', kw) : num ? wrap('tk-num', num) : esc(rest)),
  html: s => s.replace(/(<!--[\s\S]*?-->)|(<\/?)([\w-]+)([^<>]*)(\/?>)|([^<]+)|(<)/g, (m, cm, open, tag, attrs, close, text, lt) => {
    if (cm) return wrap('tk-cm', cm); if (lt) return '&lt;';
    if (tag !== undefined) return esc(open) + wrap('tk-tag', tag) + attrs.replace(/([\w-]+)(=)("[^"]*"|'[^']*'|[^\s>]+)?/g, (x, n, eq, v) => wrap('tk-attr', n) + esc(eq) + (v ? wrap('tk-str', v) : '')) + esc(close);
    return esc(text);
  }),
  md: s => s.replace(/(^---[\s\S]*?^---$)|(^#{1,6} .*$)|(^```.*$)|(`[^`\n]+`)|(^[-*] )|([^\n]+|\n)/gm,
    (m, fm, h, fence, code, li, rest) => fm ? wrap('tk-cm', fm) : h ? wrap('tk-h', h) : fence ? wrap('tk-cm', fence) : code ? wrap('tk-str', code) : li ? wrap('tk-kw', li) : esc(rest)),
  sh: s => s.replace(/(#[^\n]*)|(^\s*[\w./-]+)|("[^"]*"|'[^']*')|(--?[\w-]+)|([^\n]+|\n)/gm,
    (m, cm, cmd, str, flag, rest) => cm ? wrap('tk-cm', cm) : cmd ? wrap('tk-kw', cmd) : str ? wrap('tk-str', str) : flag ? wrap('tk-attr', flag) : esc(rest)),
  txt: s => esc(s),
};
const langFor = name => { const ext = (name.split('.').pop() || '').toLowerCase();
  return ({ css: 'css', js: 'js', ts: 'js', mjs: 'js', tsx: 'js', json: 'js', html: 'html', htm: 'html', md: 'md', sh: 'sh', bash: 'sh', txt: 'txt', py: 'js' })[ext] || 'txt'; };

/* ── Editor ────────────────────────────────────────────────────── */
const ta = $('ta'), hl = $('hl'), editorEl = $('editor'), tabsEl = $('tabs');
const editor = {
  files: [{ name: 'untitled.txt', text: '' }], tab: 0, caret: null, onInput: null, onSelect: null, onTab: null,
  render() {
    const file = this.files[this.tab] || this.files[0]; const src = file.text;
    let html = lang[langFor(file.name)](src);
    if (this.caret !== null && ta.readOnly) {
      let remaining = this.caret, out = '', inTag = false, ent = false;
      for (let k = 0; k < html.length; k++) {
        const c = html[k];
        if (remaining === 0 && !inTag && !ent) { out += '<span class="caret"></span>'; remaining = -1; }
        out += c;
        if (c === '<') inTag = true; else if (c === '>') inTag = false;
        else if (!inTag) { if (c === '&') ent = true; else if (ent && c === ';') { ent = false; remaining--; } else if (!ent) remaining--; }
      }
      if (remaining === 0) out += '<span class="caret"></span>';
      html = out;
    }
    hl.innerHTML = html.split('\n').map((l, n) => `<span class="ln">${n + 1}</span>${l}`).join('\n') + '\n';
    if (ta.value !== src) ta.value = src;
    this.syncScroll(); this.renderTabs();
  },
  renderTabs() {
    tabsEl.innerHTML = '';
    this.files.forEach((f, k) => { const b = document.createElement('button'); b.className = 'tab' + (k === this.tab ? ' active' : ''); b.textContent = f.name; b.setAttribute('role', 'tab'); b.onclick = () => this.setTab(k); tabsEl.appendChild(b); });
    if (mode === 'record') { const b = document.createElement('button'); b.className = 'tab add'; b.textContent = '+ file'; b.onclick = () => $('dlgFile').showModal(); tabsEl.appendChild(b); }
  },
  syncScroll() { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; },
  setTab(k, silent) { this.tab = k; this.render(); if (!silent && this.onTab) this.onTab(k); },
  scrollCaretIntoView() {
    const c = hl.querySelector('.caret'); if (!c) return;
    const top = c.offsetTop, h = hl.clientHeight;
    if (top < ta.scrollTop + 20 || top > ta.scrollTop + h - 40) ta.scrollTop = Math.max(0, top - h / 2);
  },
};
ta.addEventListener('scroll', () => editor.syncScroll());
ta.addEventListener('input', () => {
  const file = editor.files[editor.tab], prev = file.text, next = ta.value;
  if (prev === next) return;
  const op = diffOp(prev, next); file.text = next;
  editor.render(); schedulePreview();
  if (editor.onInput) editor.onInput(op);
});
document.addEventListener('selectionchange', () => { if (document.activeElement === ta && editor.onSelect) editor.onSelect(ta.selectionStart); });
ta.addEventListener('keydown', e => {
  if (e.key === 'Tab' && !ta.readOnly) { e.preventDefault(); ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
});

/* ── Side panel: web preview or trace ──────────────────────────── */
let previewTimer = null, previewDue = 0;
const fileText = name => (editor.files.find(f => f.name === name) || { text: '' }).text;
const renderPreview = () => {
  if (!current || current.kind !== 'web') return;
  const html = fileText('index.html'), css = fileText('style.css'), js = fileText('script.js');
  const doc = html.includes('</head>') ? html.replace('</head>', `<style>${css}</style></head>`) : `<style>${css}</style>` + html;
  $('frame').srcdoc = doc + `<script>try{${js}\n}catch(e){document.body.insertAdjacentHTML('beforeend','<pre style="color:#b00;font:12px monospace">'+e+'</pre>')}<\/script>`;
};
const schedulePreview = () => {
  const now = performance.now(); if (!previewDue) previewDue = now + 900;
  clearTimeout(previewTimer); previewTimer = setTimeout(() => { previewDue = 0; renderPreview(); }, Math.min(350, Math.max(0, previewDue - now)));
};
$('btnRun').onclick = renderPreview;

const trace = {
  lines: [],
  clear() { this.lines = []; this.render(); },
  push(l) { this.lines.push(l); this.render(); },
  render() {
    const el = $('trace');
    el.innerHTML = this.lines.length ? this.lines.map(l => `<span class="l ${l.cls || ''}">${esc(l.out)}</span>`).join('') : '<span class="empty">Terminal output appears here when the lesson runs a command.</span>';
    el.scrollTop = el.scrollHeight;
  },
};
const setSideKind = kind => {
  const web = kind === 'web';
  $('frame').hidden = !web; $('trace').hidden = web; $('btnRun').hidden = !web; $('illus').hidden = web;
  $('sideLabel').textContent = web ? 'Preview' : 'Trace'; $('sideUrl').textContent = web ? 'index.html' : 'terminal · tool calls · results';
};

/* ── Caption & checkpoint ──────────────────────────────────────── */
const caption = { set(t) { $('caption').innerHTML = t ? t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') : ''; } };
const checkpoint = {
  show(stop, onDone) {
    const el = $('checkpoint'); el.hidden = false;
    const opts = stop.options || [];
    el.innerHTML = `<div class="card"><span class="eyebrow">${opts.length ? 'Knowledge check' : 'Predict'}</span><h3>${esc(stop.title || 'Checkpoint')}</h3><p>${esc(stop.q || '')}</p>
      ${opts.length ? opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o)}</button>`).join('') : `<textarea id="cpText" placeholder="Write your prediction before continuing…"></textarea>`}
      <div class="explain" id="cpExplain" hidden></div>
      <div class="row"><button id="cpSkip" class="ghost sm">Skip</button><button id="cpGo" class="primary" ${opts.length ? 'disabled' : ''}>${opts.length ? 'Continue' : 'Reveal & continue'}</button></div></div>`;
    const finish = () => { el.hidden = true; el.innerHTML = ''; onDone(); };
    el.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const k = +b.dataset.k; el.querySelectorAll('.opt').forEach(x => { x.disabled = true; });
      b.classList.add(k === stop.correct ? 'right' : 'wrong'); if (k !== stop.correct) el.querySelectorAll('.opt')[stop.correct]?.classList.add('right');
      const ex = $('cpExplain'); ex.hidden = false; ex.innerHTML = `<b>${k === stop.correct ? 'Correct.' : 'Not quite.'}</b> ${esc(stop.explain || '')}`; $('cpGo').disabled = false;
    });
    $('cpGo').onclick = () => {
      if (!opts.length && stop.explain && $('cpExplain').hidden) { const ex = $('cpExplain'); ex.hidden = false; ex.textContent = stop.explain; $('cpGo').textContent = 'Continue'; return; }
      finish();
    };
    $('cpSkip').onclick = finish;
  },
  hide() { $('checkpoint').hidden = true; $('checkpoint').innerHTML = ''; },
};

/* ── Lessons & player ──────────────────────────────────────────── */
const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
let lessons = [], current = null, mode = 'play';
/* ── Voice: browser speech synthesis for captions (no key, no upload) ── */
const voice = {
  on: false, utter: null, clips: {}, el: null,
  supported: () => 'speechSynthesis' in window,
  // Pre-rendered Edge neural clips live in voice/<lessonId>.json next to the page; browser speech is the fallback.
  async load(id) {
    if (this.clips[id]) return this.clips[id];
    try { const r = await fetch(`voice/${id}.json`); if (!r.ok) throw new Error(); this.clips[id] = await r.json(); }
    catch { this.clips[id] = 'none'; }
    return this.clips[id];
  },
  label() { const c = current && this.clips[current.id]; return c && c !== 'none' ? 'Edge neural voice' : 'browser voice'; },
  pick() { const vs = speechSynthesis.getVoices(); return vs.find(v => /en[-_](GB|US)/i.test(v.lang) && /Google|Samantha|Daniel|Natural|Neural/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || vs[0] || null; },
  speak(text, sayIndex, onEnd) {
    if (!this.on) { onEnd(); return; }
    const c = current && this.clips[current.id];
    if (c && c !== 'none' && c.clips[sayIndex]) { // pre-rendered clip
      this.cancel(); const a = new Audio(c.clips[sayIndex]); a.playbackRate = Math.min(player.speed, 1.6); this.el = a;
      let done = false; const finish = () => { if (!done) { done = true; onEnd(); } };
      a.onended = finish; a.onerror = finish; a.play().catch(finish); return;
    }
    if (!this.supported()) { onEnd(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\*\*/g, '').replace(/`/g, ''));
    const v = this.pick(); if (v) u.voice = v; u.rate = 1.05 * (player.speed > 1 ? Math.min(player.speed, 1.6) : 1); u.pitch = 1;
    let done = false; const finish = () => { if (!done) { done = true; onEnd(); } };
    u.onend = finish; u.onerror = finish; this.utter = u; speechSynthesis.speak(u);
    setTimeout(() => { if (!done && !speechSynthesis.speaking) finish(); }, 800); // some engines never fire onend
  },
  cancel() { if (this.el) { this.el.pause(); this.el = null; } if (this.supported()) speechSynthesis.cancel(); },
  async toggle() { this.on = !this.on; const b = $('btnVoice'); b.textContent = this.on ? '🔊 Voice on' : '🔇 Voice off'; b.setAttribute('aria-pressed', String(this.on));
    if (!this.on) { this.cancel(); player.speechHold = false; return; }
    if (current) { setStatus('', 'Loading voice…'); await this.load(current.id); setStatus('', this.label()); } },
};
$('btnVoice').onclick = () => voice.toggle();
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};

const player = {
  playing: false, speechHold: false, t: 0, opIdx: 0, speed: 1, audio: null, raf: 0, lastTick: 0, forked: false, dirty: false,
  load(lesson) {
    this.stop(); current = lesson; this.forked = false; this.dirty = false; checkpoint.hide();
    this.audio = lesson.audio ? Object.assign(new Audio(lesson.audio), { preload: 'auto' }) : null;
    if (this.audio) this.audio.onended = () => this.pause();
    setSideKind(lesson.kind); this.rebuild(0);
    $('tDur').textContent = fmt(lesson.duration);
    ta.readOnly = true; editorEl.classList.add('locked'); editorEl.classList.remove('forked');
    setStatus('', `${lesson.ops.length} ops · ${lesson.audio ? 'voice' : 'captions'} · ${lesson.files.length} files`);
    renderChapters(); this.updateUI(); $('lessonSel').value = lesson.id;
    if (voice.on) voice.load(lesson.id).then(() => setStatus('', voice.label()));
  },
  rebuild(t) { editor.files = cloneFiles(current.files); editor.tab = 0; editor.caret = 0; trace.lines = []; caption.set(''); this.opIdx = 0; this.t = -1; this.seek(t); },
  seek(t) {
    const L = current; t = Math.min(Math.max(0, t), L.duration);
    if (t < this.t || this.opIdx === 0) { editor.files = cloneFiles(L.files); editor.tab = 0; editor.caret = 0; trace.lines = []; caption.set(''); this.opIdx = 0; }
    this.applyUntil(t, false); this.t = t;
    if (this.audio) { try { this.audio.currentTime = t / 1000; } catch {} }
    editor.render(); editor.scrollCaretIntoView(); trace.render(); schedulePreview(); this.updateUI();
  },
  // Apply ops with t <= target. Returns 'stop' when a live checkpoint was hit.
  applyUntil(t, live) {
    const ops = current.ops; let touched = false;
    while (this.opIdx < ops.length && ops[this.opIdx].t <= t) {
      const op = ops[this.opIdx++];
      if (op.tab !== undefined) editor.tab = op.tab;
      else if (op.c !== undefined) editor.caret = op.c;
      else if (op.say !== undefined) { caption.set(op.say);
        if (live && voice.on && !this.audio) { const resumeAt = (ops[this.opIdx] ? ops[this.opIdx].t : current.duration) - 40;
          let sayIndex = 0; for (let k = 0; k < this.opIdx - 1; k++) if (ops[k].say !== undefined) sayIndex++;
          this.speechHold = true; voice.speak(op.say, sayIndex, () => { if (this.speechHold) { this.speechHold = false; this.t = Math.max(this.t, resumeAt); } }); } }
      else if (op.out !== undefined) trace.push(op);
      else if (op.clear) trace.clear();
      else if (op.chapter !== undefined) renderChapters();
      else if (op.stop) { if (live) return 'stop'; }
      else { editor.files[op.f].text = applyOp(editor.files[op.f].text, op); editor.caret = op.p + op.i.length; editor.tab = op.f; }
      touched = true;
    }
    return touched;
  },
  play() {
    if (this.t >= current.duration) this.rebuild(0);
    if (this.forked || this.dirty) { this.forked = false; editorEl.classList.remove('forked'); this.rebuild(this.t); this.dirty = false; }
    this.playing = true; ta.readOnly = true; ta.blur(); editorEl.classList.add('locked');
    if (this.audio) { this.audio.playbackRate = this.speed; this.audio.play().catch(() => {}); }
    this.lastTick = performance.now();
    const tick = now => {
      if (!this.playing) return;
      if (this.speechHold) { this.lastTick = now; this.updateUI(); this.raf = requestAnimationFrame(tick); return; }
      const next = this.audio ? this.audio.currentTime * 1000 : this.t + (now - this.lastTick) * this.speed;
      this.lastTick = now;
      const r = this.applyUntil(next, true);
      if (r) { editor.render(); editor.scrollCaretIntoView(); schedulePreview(); }
      this.t = next; this.updateUI();
      if (r === 'stop') { const stopOp = current.ops[this.opIdx - 1]; this.t = stopOp.t; this.pause(true); checkpoint.show(stopOp.stop, () => this.play()); return; }
      if (this.t >= current.duration) { this.t = current.duration; this.pause(); return; }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick); this.updateUI();
  },
  pause(keepLocked) {
    this.playing = false; cancelAnimationFrame(this.raf); voice.cancel(); this.speechHold = false;
    if (this.audio) this.audio.pause();
    if (!keepLocked) { ta.readOnly = false; editorEl.classList.remove('locked'); editor.caret = null; this.dirty = true; editor.render(); }
    this.updateUI();
  },
  stop() { this.playing = false; cancelAnimationFrame(this.raf); voice.cancel(); this.speechHold = false; if (this.audio) this.audio.pause(); },
  updateUI() {
    $('btnPlay').textContent = this.playing ? '❚❚ Pause' : (current && this.t >= current.duration ? '↺ Replay' : '▶ Play');
    $('tCur').textContent = fmt(this.t);
    if (current) { $('scrub').value = Math.round(1000 * this.t / Math.max(1, current.duration));
      const chs = current.ops.filter(o => o.chapter !== undefined); let on = -1; chs.forEach((c, k) => { if (c.t <= this.t) on = k; });
      $('chapters').querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === on)); }
  },
};
const renderChapters = () => {
  const chs = current ? current.ops.filter(o => o.chapter !== undefined) : [];
  $('chapters').innerHTML = chs.map(c => `<button data-t="${c.t}">${esc(c.chapter)}</button>`).join('');
  $('chapters').onclick = e => { const b = e.target.closest('button'); if (!b) return; const was = player.playing; player.stop(); checkpoint.hide(); player.rebuild(+b.dataset.t); if (was) player.play(); };
};
$('btnPlay').onclick = () => player.playing ? player.pause() : player.play();
$('scrub').oninput = e => { const was = player.playing; player.stop(); checkpoint.hide(); player.seek(e.target.value / 1000 * current.duration); if (was) player.play(); };
$('speed').onclick = e => { const b = e.target.closest('button'); if (!b) return; player.speed = +b.dataset.s;
  $('speed').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); if (player.audio) player.audio.playbackRate = player.speed; };
$('btnReset').onclick = () => { player.stop(); player.forked = false; editorEl.classList.remove('forked'); player.rebuild(player.t); player.pause(); };
editor.onInput = op => { if (mode === 'play' && !player.playing) { player.forked = true; editorEl.classList.add('forked'); } else if (mode === 'record') recorder.onInput(); };
editor.onSelect = pos => { if (mode === 'record') recorder.onCaret(pos); };
editor.onTab = k => { if (mode === 'record') recorder.onTab(k); };
document.addEventListener('keydown', e => {
  if (mode !== 'play' || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); $('btnPlay').click(); }
  if (e.key === 'ArrowLeft') player.seek(player.t - 5000);
  if (e.key === 'ArrowRight') player.seek(player.t + 5000);
});

/* ── Recorder ──────────────────────────────────────────────────── */
const recorder = {
  active: false, t0: 0, ops: [], initial: null, shadow: null, media: null, chunks: [], timer: 0, lastCaret: -1, kind: 'trace',
  now() { return performance.now() - this.t0; },
  onInput() {
    if (!this.active) return;
    const f = editor.tab, prev = this.shadow[f], next = editor.files[f].text;
    const op = diffOp(prev, next); this.shadow[f] = next;
    this.ops.push({ t: Math.round(this.now()), f, ...op }); this.lastCaret = op.p + op.i.length;
  },
  onCaret(pos) { if (!this.active || pos === this.lastCaret) return; this.lastCaret = pos; this.ops.push({ t: Math.round(this.now()), c: pos }); },
  onTab(k) { if (this.active) this.ops.push({ t: Math.round(this.now()), tab: k }); },
  add(op) { if (!this.active) { setStatus('', 'Press Record first'); return; } this.ops.push({ t: Math.round(this.now()), ...op }); },
  async start() {
    this.initial = cloneFiles(editor.files); this.shadow = editor.files.map(f => f.text); this.ops = []; this.chunks = []; this.media = null;
    if ($('chkMic').checked && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', ''].find(m => !m || MediaRecorder.isTypeSupported(m));
        this.media = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : undefined);
        this.media.ondataavailable = e => e.data.size && this.chunks.push(e.data);
        this.media.start(1000);
      } catch { setStatus('', 'Mic unavailable — recording keystrokes only'); this.media = null; }
    }
    this.t0 = performance.now(); this.active = true; if (editor.tab !== 0) this.ops.push({ t: 0, tab: editor.tab });
    ta.readOnly = false; ta.focus();
    $('btnRec').textContent = '■ Stop'; $('dot').classList.add('live'); $('statusText').textContent = 'Recording';
    this.timer = setInterval(() => $('tRec').textContent = fmt(this.now()), 250);
  },
  async stop() {
    const duration = Math.round(this.now()) + 400; this.active = false; clearInterval(this.timer);
    $('dot').classList.remove('live'); $('btnRec').textContent = '● Record';
    let audio = null;
    if (this.media) {
      audio = await new Promise(res => {
        this.media.onstop = () => { const blob = new Blob(this.chunks, { type: this.media.mimeType }); const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); };
        this.media.stop(); this.media.stream.getTracks().forEach(t => t.stop());
      });
    }
    const lesson = { id: 'l' + Date.now().toString(36), title: pendingTitle || 'Untitled lesson', kind: this.kind, files: this.initial, ops: this.ops, duration, audio, createdAt: new Date().toISOString() };
    lessons.push(lesson);
    if (!persist()) setStatus('', 'Saved for this session only (browser storage unavailable) — use Export to keep it');
    refreshList(); setMode('play'); player.load(lesson);
  },
  cancel() { if (this.active) { this.active = false; clearInterval(this.timer); this.media?.stream.getTracks().forEach(t => t.stop()); $('dot').classList.remove('live'); } },
};
$('btnRec').onclick = () => recorder.active ? recorder.stop() : recorder.start();
$('btnCancelRec').onclick = () => { recorder.cancel(); setMode('play'); player.load(current || lessons[0]); };
$('recLine').addEventListener('click', e => {
  const b = e.target.closest('button[data-add]'); if (!b) return;
  const text = $('recText').value.trim(); if (!text) return;
  const kind = b.dataset.add;
  if (kind === 'say') { recorder.add({ say: text }); caption.set(text); }
  else if (kind === 'chapter') recorder.add({ chapter: text });
  else { recorder.add({ out: text, cls: kind }); trace.push({ out: text, cls: kind }); }
  $('recText').value = ''; $('recText').focus();
});
$('recText').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('recLine').querySelector('[data-add="say"]').click(); } });
$('btnAddStop').onclick = () => { ['stopTitle', 'stopQ', 'stopOpts', 'stopExplain'].forEach(id => $(id).value = ''); $('dlgStop').showModal(); };
$('dlgStop').onclose = () => {
  if ($('dlgStop').returnValue !== 'ok') return;
  const raw = $('stopOpts').value.split('\n').map(s => s.trim()).filter(Boolean);
  const stop = { title: $('stopTitle').value.trim(), q: $('stopQ').value.trim(), explain: $('stopExplain').value.trim() };
  if (raw.length) { stop.options = raw.map(s => s.replace(/^\*\s*/, '')); stop.correct = Math.max(0, raw.findIndex(s => s.startsWith('*'))); }
  recorder.add({ stop });
};
$('dlgFile').onclose = () => {
  if ($('dlgFile').returnValue !== 'ok') return;
  const name = $('fileName').value.trim(); if (!name || editor.files.some(f => f.name === name)) return;
  editor.files.push({ name, text: '' }); if (recorder.active) { recorder.initial.push({ name, text: '' }); recorder.shadow.push(''); }
  editor.setTab(editor.files.length - 1); $('fileName').value = '';
};

/* ── Modes & chrome ────────────────────────────────────────────── */
let pendingTitle = '';
const setStatus = (dotCls, text) => { $('dot').className = 'dot ' + dotCls; $('statusText').textContent = text; };
const setMode = m => {
  mode = m; const play = m === 'play';
  $('playerBar').hidden = !play; $('chapters').hidden = !play; $('recBar').hidden = play; $('recLine').hidden = play;
  $('hint').innerHTML = play
    ? '<b>Pause</b> at any moment to edit the instructor\'s files. <b>Play</b> resumes the lesson. <kbd>Space</kbd> play/pause · <kbd>←</kbd><kbd>→</kbd> ±5s · <b>Voice</b> reads the captions aloud'
    : 'Type while you talk. Use the line box to add narration (shown as captions), terminal output, chapters and checkpoints as you go.';
  editor.renderTabs();
};
const lessonSel = $('lessonSel');
const refreshList = () => { lessonSel.innerHTML = lessons.map(l => `<option value="${l.id}">${esc(l.title)}${l.builtin ? ' · sample' : ''}</option>`).join(''); if (current) lessonSel.value = current.id; };
const persist = () => store.save(lessons.filter(l => !l.builtin));
lessonSel.onchange = () => { const l = lessons.find(x => x.id === lessonSel.value); if (l) { recorder.cancel(); setMode('play'); player.load(l); } };
$('btnNew').onclick = () => { $('newTitle').value = ''; $('newFiles').value = ''; $('dlgNew').showModal(); };
$('dlgNew').onclose = () => {
  if ($('dlgNew').returnValue !== 'ok') return;
  pendingTitle = $('newTitle').value.trim(); player.stop(); checkpoint.hide();
  recorder.kind = $('newKind').value;
  const names = $('newFiles').value.split('\n').map(s => s.trim()).filter(Boolean);
  if (names.length) editor.files = names.map(name => ({ name, text: '' }));
  else if (recorder.kind === 'web' && current?.kind !== 'web') editor.files = [{ name: 'index.html', text: '<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8">\n</head>\n<body>\n\n</body>\n</html>\n' }, { name: 'style.css', text: '' }, { name: 'script.js', text: '' }];
  else editor.files = cloneFiles(editor.files);
  editor.caret = null; editor.tab = 0; editorEl.classList.remove('locked', 'forked'); ta.readOnly = false;
  trace.clear(); caption.set(''); setSideKind(recorder.kind); current = { kind: recorder.kind, files: [], ops: [], duration: 0, id: '' };
  setMode('record'); editor.render(); renderPreview(); $('tRec').textContent = '0:00';
  setStatus('', 'Set your starting files, then press Record'); ta.focus();
};
$('btnDelete').onclick = () => {
  if (!current || current.builtin) { setStatus('', 'Built-in lessons can\'t be deleted'); return; }
  lessons = lessons.filter(l => l !== current); persist(); refreshList(); player.load(lessons[0]);
};
const dlgIO = $('dlgIO');
$('btnExport').onclick = () => {
  if (!current?.id) return;
  const json = JSON.stringify(current); $('ioTitle').textContent = 'Export lesson'; $('ioHint').textContent = 'Copy this JSON and keep it anywhere — a file, a repo, a CMS. Paste it back with Import on any device.';
  $('ioText').value = json; $('ioText').readOnly = true; $('ioLoad').hidden = true; $('ioCopy').hidden = false;
  $('ioSize').textContent = `${(json.length / 1024).toFixed(0)} KB · ${current.ops.length} ops · ${fmt(current.duration)}${current.audio ? ' · audio embedded' : ''}`;
  dlgIO.showModal();
};
$('btnImport').onclick = () => {
  $('ioTitle').textContent = 'Import lesson'; $('ioHint').textContent = 'Paste a lesson JSON exported from Aetherlab.'; $('ioText').value = ''; $('ioText').readOnly = false;
  $('ioLoad').hidden = false; $('ioCopy').hidden = true; $('ioSize').textContent = ''; dlgIO.showModal(); $('ioText').focus();
};
$('ioClose').onclick = () => dlgIO.close();
$('ioCopy').onclick = async () => { try { await navigator.clipboard.writeText($('ioText').value); $('ioCopy').textContent = 'Copied ✓'; setTimeout(() => $('ioCopy').textContent = 'Copy', 1500); } catch { $('ioText').select(); } };
$('ioLoad').onclick = () => {
  try {
    const l = JSON.parse($('ioText').value);
    if (!Array.isArray(l.files) || !Array.isArray(l.ops) || typeof l.duration !== 'number') throw new Error('not a lesson');
    if (typeof l.files[0] === 'string') l.files = l.files.map((text, k) => ({ name: ['index.html', 'style.css', 'script.js'][k] || `file${k}.txt`, text })); // v1 export
    l.kind = l.kind || 'web'; l.id = 'l' + Date.now().toString(36); delete l.builtin; lessons.push(l); persist(); refreshList(); dlgIO.close(); setMode('play'); player.load(l);
  } catch { $('ioSize').textContent = 'That doesn\'t look like a Aetherlab lesson JSON.'; }
};


/* ── Boot (lesson-id contract) ─────────────────────────────────── */
export function bootApp() {
  const params = new URLSearchParams(location.search);
  const fromQuery = params.get("lesson");
  const fromWindow = typeof window !== "undefined" ? window.__AETHERLAB_LESSON_ID__ : undefined;
  const resolved = resolveLessonId(fromQuery || fromWindow || null);
  const banner = document.getElementById("lesson-banner");
  if (banner) {
    if (resolved.reason === "missing") {
      banner.hidden = false;
      banner.textContent = `Default lesson · ${resolved.id}`;
    } else if (resolved.reason === "unknown") {
      banner.hidden = false;
      banner.textContent = `Unknown lesson · loaded ${resolved.id}`;
    } else {
      banner.hidden = true;
    }
  }

  // Sort by leading workshop number in title (same as monolith)
  const builtin = [...BUILTIN_LESSONS].sort(
    (a, b) => (parseInt(a.title, 10) || 99) - (parseInt(b.title, 10) || 99),
  );
  lessons = [...builtin, ...store.load()];
  window.lessons = lessons;
  window.player = player;
  refreshList();
  setMode("play");
  const initial = getLesson(resolved.id);
  // ensure selected lesson is in list (builtin always is)
  if (!lessons.find((l) => l.id === initial.id)) lessons.unshift(initial);
  player.load(initial);

  // When live checkpoint has assert, soft-evaluate against current fold (non-blocking UX)
  const _show = checkpoint.show.bind(checkpoint);
  checkpoint.show = (stop, onDone) => {
    if (stop && stop.assert && current) {
      const state = {
        files: editor.files,
        tab: editor.tab,
        caret: editor.caret,
        caption: "",
        trace: trace.lines,
        stop,
        t: player.t,
      };
      const r = evaluateAssert(state, stop.assert);
      if (!r.ok) console.warn("[arcade-lab] checkpoint assert failed:", r.detail);
    }
    return _show(stop, onDone);
  };
}
