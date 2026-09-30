// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe, expect, test, vi} from 'vitest';
import {Deck} from '@academy/deck';
import {sourceSlides} from '../src/deck/slides.ts';
import {normalizeSlides} from '../src/deck/normalize.ts';
import {matchProductDeck} from '../src/routes.tsx';

const slides = normalizeSlides(sourceSlides);
const day1 = slides.filter((s) => s.lessonId === 'teaching-day-1');
const day2 = slides.filter((s) => s.lessonId === 'teaching-day-2');

const mount = async (element: React.ReactElement) => {
  (globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true;
  Element.prototype.scrollIntoView = function () {};
  window.scrollTo = () => {};
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(element);
  });
  return {host, unmount: () => act(() => root.unmount())};
};

describe('AET-121 Classroom 1–2 deck interactions', () => {
  test('pins SoT tip bb497e28 and keeps C1/C2 product decks off Shell', () => {
    expect(sourceSlides).toHaveLength(113);
    expect(day1).toHaveLength(67);
    expect(day2).toHaveLength(46);
    expect(matchProductDeck('/classroom/1')).toBe('classroom-1');
    expect(matchProductDeck('/classroom/2')).toBe('classroom-2');
  });

  test('preserves SoT interaction surfaces on Classroom 1 and 2', () => {
    const all = [...day1, ...day2];
    expect(all.every((s) => typeof s.notes === 'string' && s.notes.length > 0)).toBe(true);
    expect(all.filter((s) => s.layout === 'exercise').length).toBeGreaterThan(0);
    expect(all.filter((s) => s.visual && (s.visual as {reveal?: string}).reveal === 'click').length).toBeGreaterThan(0);
    expect(all.filter((s) => s.visual && (s.visual as {quiz?: unknown}).quiz).length).toBeGreaterThan(0);
    expect(all.filter((s) => s.visual && (s.visual as {countdown?: number}).countdown).length).toBeGreaterThan(0);
    expect(all.filter((s) => typeof s.prompt === 'string' && s.prompt.length > 0).length).toBeGreaterThan(0);
    expect(all.filter((s) => s.planB || (s.visual as {planB?: string} | undefined)?.planB).length).toBeGreaterThan(0);
    expect(all.filter((s) => s.visual && (s.visual as {bot?: string}).bot).length).toBeGreaterThan(0);
    expect(all.some((s) => typeof s.stepsHeading === 'string')).toBe(true);
  });

  test('projector mode never paints facilitator notes; presenter mode shows them', async () => {
    const noted = day1.find((s) => typeof s.notes === 'string' && (s.notes as string).length > 40)!;
    const secret = noted.notes as string;

    const projector = await mount(
      <Deck slides={day1} index={day1.indexOf(noted)} revealStep={-1} mode="projector" onIndexChange={() => {}} onRevealStepChange={() => {}} />,
    );
    expect(projector.host.querySelector('.academy-deck')!.className).toContain('mode-projector');
    expect(projector.host.textContent).not.toContain(secret);
    expect(projector.host.querySelector('.deck-presenter-tools')).toBeNull();
    expect(projector.host.querySelector('.presenter-dialog')).toBeNull();
    expect(projector.host.querySelector('#fullscreen')).not.toBeNull();
    expect(projector.host.querySelector('#chapters')).not.toBeNull();
    expect(projector.host.querySelector('#prompt')).not.toBeNull();
    await projector.unmount();

    const presenter = await mount(
      <Deck slides={day1} index={day1.indexOf(noted)} revealStep={-1} mode="presenter" onIndexChange={() => {}} onRevealStepChange={() => {}} />,
    );
    expect(presenter.host.querySelector('.deck-presenter-tools')).not.toBeNull();
    expect(presenter.host.textContent).toContain(secret);
    await presenter.unmount();
  });

  test('Presenter view on projector opens a separate mode=presenter window (notes stay off the shared surface)', async () => {
    const opened: string[] = [];
    const openSpy = vi.spyOn(window, 'open').mockImplementation((url) => {
      opened.push(String(url));
      return null;
    });
    // jsdom location may be about:blank — set a classroom-like href for URL building
    window.history.pushState({}, '', '/classroom/1?index=3');

    const {host, unmount} = await mount(
      <Deck slides={day1} index={3} revealStep={-1} mode="projector" onIndexChange={() => {}} onRevealStepChange={() => {}} />,
    );
    const btn = host.querySelector('#presenter') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    await act(async () => {
      btn.click();
    });
    expect(opened.length).toBe(1);
    const openedUrl = new URL(opened[0]!, 'http://localhost');
    expect(openedUrl.searchParams.get('mode')).toBe('presenter');
    expect(openedUrl.searchParams.get('index')).toBe('3');
    expect(host.querySelector('.deck-presenter-tools')).toBeNull();
    expect(host.querySelector('.presenter-dialog')).toBeNull();
    openSpy.mockRestore();
    await unmount();
  });
});
