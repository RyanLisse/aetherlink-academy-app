'use strict';
/* ==========================================================================
   Shared timers for the deck (index.html) and the presenter view.
   State lives in localStorage, so a timer keeps the right time when you move
   to another slide and back, and both windows show (and control) the same
   timer. Nothing starts on its own: every timer waits for ▶ Start.
   State per timer: { total, left, running, endAt } in seconds / ms.
   ========================================================================== */
(function () {
  const PREFIX = 'als:timer:';
  const fmt = sec => String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
  const key = (index, title) => PREFIX + index + ':' + (title || '');
  function read(k, defSec) {
    let t = null; try { t = JSON.parse(localStorage.getItem(k) || 'null'); } catch {}
    return t && typeof t.total === 'number' ? t : { total: defSec, left: defSec, running: false, endAt: 0 };
  }
  function write(k, t) { try { localStorage.setItem(k, JSON.stringify(t)); } catch {} }
  const left = t => t.running ? Math.max(0, Math.round((t.endAt - Date.now()) / 1000)) : Math.max(0, t.left);
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }

  /* o: { key, defaultSec, minutes (bool: show a minutes field), back (bool: "Back at hh:mm"),
         boxCls, faceCls, lateCls, lateAt, bar (bool), doneText, onDone, onEmpty, prefix (node), signal } */
  function mount(o) {
    const box = el('div', o.boxCls || 'timer'); const face = el('div', o.faceCls || 'timer-face', '00:00');
    const bar = el('div', 'timer-bar'), fill = el('div', 'timer-fill'); bar.append(fill);
    const back = el('p', 'pause-back'); back.hidden = true;
    const ctrl = el('div', 'widget-controls timer-controls');
    let input = null;
    if (o.minutes) {
      const field = el('label', 'timer-field'); input = document.createElement('input');
      input.type = 'number'; input.min = '0'; input.max = '180'; input.step = '1'; input.placeholder = '0';
      input.setAttribute('aria-label', 'Minutes'); field.append(input, el('span', null, 'min')); ctrl.append(field);
    }
    const play = el('button', 'timer-play', '▶ Start');
    const minus = el('button', 'secondary', '−1 min'), plus = el('button', 'secondary', '+1 min'), reset = el('button', 'secondary', 'Reset');
    ctrl.append(play, minus, plus, reset);
    let doneFired = false;
    const get = () => read(o.key, o.defaultSec || 0);
    function paint() {
      const t = get(); const l = left(t);
      if (t.running && l === 0) { t.running = false; t.left = 0; write(o.key, t); if (!doneFired) { doneFired = true; o.onDone?.(); } }
      face.textContent = t.total > 0 && l === 0 && o.doneText ? o.doneText : fmt(l);
      fill.style.width = t.total ? (100 * (1 - l / t.total)) + '%' : '0%';
      const late = t.total > 0 && l > 0 && l <= (o.lateAt ?? 60);
      box.classList.toggle(o.lateCls || 'timer-late', late); box.classList.toggle('done', t.total > 0 && l === 0);
      box.classList.toggle('running', t.running);
      play.textContent = t.running ? '❚❚ Pause' : (l > 0 && l < t.total ? '▶ Resume' : '▶ Start');
      if (input && document.activeElement !== input) input.value = t.total ? String(Math.round(t.total / 60)) : '';
      if (o.back) {
        back.hidden = !t.running;
        if (t.running) back.replaceChildren(document.createTextNode('Back at '), el('strong', null, new Date(t.endAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })));
      }
    }
    // every change goes through here: mutate t.left / t.total / t.running, then re-anchor endAt
    function set(mut) { const t = get(); const l = left(t); t.left = l; if (mut(t, l) === false) return; if (t.running) t.endAt = Date.now() + t.left * 1000; write(o.key, t); doneFired = false; paint(); }
    play.addEventListener('click', () => set(t => {
      if (t.running) { t.running = false; return; }
      if (t.left <= 0) { if (!t.total) { o.onEmpty?.(); input?.focus(); return false; } t.left = t.total; }
      t.running = true;
    }));
    minus.addEventListener('click', () => set(t => { t.total = Math.max(0, t.total - 60); t.left = Math.max(0, t.left - 60); }));
    plus.addEventListener('click', () => set(t => { t.total += 60; t.left += 60; }));
    reset.addEventListener('click', () => set(t => { t.running = false; if (!o.minutes) t.total = o.defaultSec || 0; t.left = t.total; }));
    if (input) {
      input.addEventListener('change', () => set(t => { const m = Math.max(0, Math.min(180, Math.floor(Number(input.value) || 0))); t.total = m * 60; t.left = m * 60; }));
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); input.dispatchEvent(new Event('change')); if (!get().running) play.click(); } });
    }
    if (o.prefix) box.append(o.prefix);
    box.append(face); if (o.bar) box.append(bar); if (o.back) box.append(back); box.append(ctrl);
    paint(); const iv = setInterval(paint, 500);
    o.signal?.addEventListener('abort', () => clearInterval(iv));
    return box;
  }
  window.ALSTimer = { fmt, key, read, write, left, mount };
})();
