// Standalone presentation export, ported from the agent-native
// actions/export-html.ts viewer: scaled canvas, keyboard navigation,
// fullscreen, click-to-advance, no external scripts.
import {aspectRatioDims,type Deck} from './schema.ts';
import {escapeHtml,sanitizeSlideContent} from './html.ts';

const cssToken=(value:string|undefined,fallback:string)=>{
 if(!value)return fallback;
 const clean=value.replace(/[{}<>;]/g,'').trim();
 return clean&&!/url\s*\(|expression\s*\(|@import/i.test(clean)?clean:fallback;
};

export function renderDeckHtml(deck:Deck,{includeNotes=false}={}):string{
 const dims=aspectRatioDims(deck.aspectRatio);
 const ds=deck.designSystem;
 const vars=[
  ['--ds-bg',cssToken(ds?.bg,'#F5F2EA')],['--ds-surface',cssToken(ds?.surface,'rgba(0,0,0,0.05)')],['--ds-text',cssToken(ds?.text,'#171717')],
  ['--ds-text-muted',cssToken(ds?.textMuted,'#5c5c5c')],['--ds-accent',cssToken(ds?.accent,'#0f766e')],['--ds-heading-font',cssToken(ds?.headingFont,'Inter, system-ui, sans-serif')],
  ['--ds-body-font',cssToken(ds?.bodyFont,'Inter, system-ui, sans-serif')],['--ds-radius',cssToken(ds?.radius,'8px')],
 ].map(([k,v])=>`${k}: ${v};`).join(' ');
 const slides=deck.slides.map((slide,index)=>`      <section class="slide" data-slide-id="${escapeHtml(slide.id)}" style="display:${index===0?'flex':'none'};${slide.background?` background:${cssToken(slide.background,'transparent')};`:''}">${sanitizeSlideContent(slide.content)}${includeNotes&&slide.notes?`<aside class="notes" hidden>${escapeHtml(slide.notes)}</aside>`:''}</section>`).join('\n');
 return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(deck.title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #111; overflow: hidden; font-family: Inter, system-ui, sans-serif; }
    :root { ${vars} }
    .viewport { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; }
    .slide-container { width: ${dims.width}px; height: ${dims.height}px; position: relative; transform-origin: center center; }
    .slide { width: ${dims.width}px; height: ${dims.height}px; position: absolute; inset: 0; overflow: hidden; background: var(--ds-bg); color: var(--ds-text); font-family: var(--ds-body-font); }
    .slide > .fmd-slide { width: 100%; height: 100%; box-sizing: border-box; }
    .fmd-slide h1, .fmd-slide h2, .fmd-slide h3 { font-family: var(--ds-heading-font); }
    .bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 40px; background: rgba(0,0,0,.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; font-size: 13px; color: rgba(255,255,255,.6); z-index: 100; opacity: 0; transition: opacity .2s; }
    .viewport:hover .bottom-bar, .bottom-bar:focus-within { opacity: 1; }
    @media (hover: none) { .bottom-bar { opacity: 1; } }
    .controls { display: flex; gap: 16px; align-items: center; }
    .controls button { border: 0; background: transparent; color: inherit; font: inherit; cursor: pointer; min-height: 32px; }
    .controls button:disabled { opacity: .4; cursor: default; }
    kbd { background: rgba(255,255,255,.1); border-radius: 3px; padding: 1px 5px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="viewport" id="viewport">
    <div class="slide-container" id="slideContainer">
${slides}
    </div>
    <div class="bottom-bar">
      <div id="counter">1 / ${deck.slides.length}</div>
      <div class="controls">
        <button type="button" id="previousSlide" aria-label="Vorige slide"><kbd>&larr;</kbd></button>
        <button type="button" id="nextSlide" aria-label="Volgende slide"><kbd>&rarr;</kbd></button>
        <button type="button" id="fullscreenButton"><kbd>F</kbd> volledig scherm</button>
        <span><kbd>Esc</kbd> sluiten</span>
      </div>
    </div>
  </div>
  <script>
    (function () {
      var current = 0, total = ${deck.slides.length};
      var slides = document.querySelectorAll('.slide'), counter = document.getElementById('counter');
      var container = document.getElementById('slideContainer');
      var prev = document.getElementById('previousSlide'), next = document.getElementById('nextSlide'), full = document.getElementById('fullscreenButton');
      function show(i) { if (i < 0 || i >= total) return; slides[current].style.display = 'none'; current = i; slides[current].style.display = 'flex'; counter.textContent = (current + 1) + ' / ' + total; prev.disabled = current === 0; next.disabled = current === total - 1; }
      function toggleFullscreen() { try { if (window !== window.top) return; } catch (err) { return; } if (document.fullscreenElement) { document.exitFullscreen && document.exitFullscreen().catch(function () {}); } else if (document.documentElement.requestFullscreen) { document.documentElement.requestFullscreen().catch(function () {}); } }
      function fit() { var s = Math.min(window.innerWidth / ${dims.width}, window.innerHeight / ${dims.height}); container.style.transform = 'scale(' + s + ')'; }
      prev.addEventListener('click', function () { show(current - 1); });
      next.addEventListener('click', function () { show(current + 1); });
      full.addEventListener('click', toggleFullscreen);
      prev.disabled = true; next.disabled = total < 2;
      window.addEventListener('resize', fit); fit();
      document.addEventListener('keydown', function (e) {
        switch (e.key) {
          case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown': if (e.key === ' ' && e.target.closest && e.target.closest('button')) break; e.preventDefault(); show(current + 1); break;
          case 'ArrowLeft': case 'ArrowUp': case 'PageUp': e.preventDefault(); show(current - 1); break;
          case 'Home': e.preventDefault(); show(0); break;
          case 'End': e.preventDefault(); show(total - 1); break;
          case 'f': case 'F': toggleFullscreen(); break;
        }
      });
      document.getElementById('viewport').addEventListener('click', function (e) {
        if (e.target.closest('.bottom-bar')) return;
        show(e.clientX < window.innerWidth / 3 ? current - 1 : current + 1);
      });
    })();
  </script>
</body>
</html>
`;
}
