import {describe, expect, it} from 'vitest';
import {
  connectHost,
  connectLab,
  parseHostMessage,
  parseLabCompletion,
  parseLabMessage,
  parseOriginAllowlist,
  resolveLabs,
  type LabMessageEvent,
  type MessageHub,
} from '../src/index.ts';

type Posted = {message: unknown; origin: string};

function fakeHub() {
  const listeners = new Set<(event: LabMessageEvent) => void>();
  const hub: MessageHub = {
    addEventListener: (_type, listener) => void listeners.add(listener),
    removeEventListener: (_type, listener) => void listeners.delete(listener),
  };
  return {hub, deliver: (event: LabMessageEvent) => listeners.forEach(listener => listener(event))};
}

function fakeWindow() {
  const posted: Posted[] = [];
  return {posted, postMessage: (message: unknown, origin: string) => void posted.push({message, origin})};
}

const LAB = resolveLabs([{id: 'ws-5-sdk-quickstart', src: '/arcade-lab/?lesson=ws-5-sdk-quickstart&embed=1', title: 'SDK quickstart'}], {
  baseUrl: 'https://academy.example',
  allowedOrigins: ['https://academy.example'],
})[0]!;

describe('message schema', () => {
  it('parses a valid complete message and strips unknown keys', () => {
    expect(
      parseLabMessage({v: 1, type: 'complete', labId: 'ws-5', result: {outcome: 'completed', score: {value: 2, max: 2}}, evidence: '2/2', extra: 'x'}),
    ).toEqual({v: 1, type: 'complete', labId: 'ws-5', result: {outcome: 'completed', score: {value: 2, max: 2}}, evidence: '2/2'});
  });

  it('rejects wrong version, unknown type, bad progress and oversized payloads', () => {
    expect(parseLabMessage({v: 2, type: 'ready'})).toBe(null);
    expect(parseLabMessage({v: 1, type: 'launch'})).toBe(null);
    expect(parseLabMessage('{"v":1,"type":"ready"}')).toBe(null);
    expect(parseLabMessage({v: 1, type: 'progress', step: 3, total: 2})).toBe(null);
    expect(parseLabMessage({v: 1, type: 'progress', step: 1, total: 2})).toEqual({v: 1, type: 'progress', step: 1, total: 2});
    expect(parseLabMessage({v: 1, type: 'error', message: 'x'.repeat(9000)})).toBe(null);
    expect(parseLabMessage({v: 1, type: 'complete', labId: 'Bad Id', result: {outcome: 'completed'}})).toBe(null);
    expect(parseLabMessage({v: 1, type: 'complete', labId: 'ok', result: {outcome: 'passed'}})).toBe(null);
  });

  it('parses init only with a known locale and flat config', () => {
    expect(parseHostMessage({v: 1, type: 'init', labId: 'lab-1', config: {lesson: 'x'}, locale: 'nl'})).toEqual({
      v: 1,
      type: 'init',
      labId: 'lab-1',
      config: {lesson: 'x'},
      locale: 'nl',
    });
    expect(parseHostMessage({v: 1, type: 'init', labId: 'lab-1', config: {nested: {a: 1}}, locale: 'nl'})).toBe(null);
    expect(parseHostMessage({v: 1, type: 'init', labId: 'lab-1', config: {}, locale: 'de'})).toBe(null);
  });

  it('bounds completion evidence', () => {
    expect(parseLabCompletion({labId: 'lab-1', result: {outcome: 'completed'}, evidence: 'x'.repeat(2001)})).toBe(null);
    expect(parseLabCompletion({labId: 'lab-1', result: {outcome: 'completed'}})).toEqual({labId: 'lab-1', result: {outcome: 'completed'}});
  });
});

describe('server-side lab config', () => {
  it('drops wildcard and path entries from the origin allowlist', () => {
    expect(parseOriginAllowlist('*, https://labs.example , https://x.example/path, ftp://f.example', 'https://academy.example')).toEqual([
      'https://academy.example',
      'https://labs.example',
    ]);
  });

  it('resolves relative src against the Academy origin and fails closed on unlisted origins', () => {
    expect(
      resolveLabs(
        [
          {id: 'arcade', src: '/arcade-lab/?lesson=sample-counter&embed=1', title: 'Arcade'},
          {id: 'evil', src: 'https://evil.example/lab', title: 'Evil'},
          {id: 'arcade', src: '/dupe', title: 'Duplicate'},
          {id: 'js', src: 'javascript:alert(1)', title: 'Script'},
        ],
        {baseUrl: 'https://academy.example', allowedOrigins: ['https://academy.example']},
      ),
    ).toEqual([
      {
        id: 'arcade',
        src: 'https://academy.example/arcade-lab/?lesson=sample-counter&embed=1',
        origin: 'https://academy.example',
        title: 'Arcade',
        config: {},
      },
    ]);
  });
});

describe('host bridge', () => {
  it('answers ready with init to the lab origin and ignores other origins, sources and schemas', () => {
    const {hub, deliver} = fakeHub();
    const frame = fakeWindow();
    const received: unknown[] = [];
    connectHost(hub, {contentWindow: frame}, LAB, {locale: 'nl', onMessage: message => received.push(message)});

    deliver({origin: 'https://evil.example', source: frame, data: {v: 1, type: 'ready'}});
    deliver({origin: LAB.origin, source: fakeWindow(), data: {v: 1, type: 'ready'}});
    deliver({origin: LAB.origin, source: frame, data: {v: 1, type: 'progress', step: 'one', total: 2}});
    deliver({origin: LAB.origin, source: frame, data: {v: 1, type: 'complete', labId: 'other-lab', result: {outcome: 'completed'}}});
    expect(received).toEqual([]);
    expect(frame.posted).toEqual([]);

    deliver({origin: LAB.origin, source: frame, data: {v: 1, type: 'ready'}});
    deliver({origin: LAB.origin, source: frame, data: {v: 1, type: 'complete', labId: 'ws-5-sdk-quickstart', result: {outcome: 'completed'}}});
    expect(frame.posted).toEqual([
      {message: {v: 1, type: 'init', labId: 'ws-5-sdk-quickstart', config: {}, locale: 'nl'}, origin: 'https://academy.example'},
    ]);
    expect(received).toEqual([
      {v: 1, type: 'ready'},
      {v: 1, type: 'complete', labId: 'ws-5-sdk-quickstart', result: {outcome: 'completed'}},
    ]);
  });
});

describe('lab bridge', () => {
  it('stays silent until a valid init arrives from the parent at an allowlisted origin', () => {
    const {hub, deliver} = fakeHub();
    const parent = fakeWindow();
    const inits: unknown[] = [];
    const lab = connectLab(hub, parent, {allowedHostOrigins: ['https://academy.example'], onInit: message => inits.push(message)});
    expect(parent.posted).toEqual([{message: {v: 1, type: 'ready'}, origin: 'https://academy.example'}]);
    expect(lab.complete({outcome: 'completed'})).toBe(false);

    const init = {v: 1, type: 'init', labId: 'arcade', config: {}, locale: 'en'};
    deliver({origin: 'https://evil.example', source: parent, data: init});
    deliver({origin: 'https://academy.example', source: fakeWindow(), data: init});
    deliver({origin: 'https://academy.example', source: parent, data: {...init, v: 9}});
    expect(inits).toEqual([]);

    deliver({origin: 'https://academy.example', source: parent, data: init});
    expect(lab.progress(1, 3)).toBe(true);
    expect(lab.complete({outcome: 'completed'}, '3/3')).toBe(true);
    expect(inits).toEqual([init]);
    expect(parent.posted.slice(1)).toEqual([
      {message: {v: 1, type: 'progress', step: 1, total: 3}, origin: 'https://academy.example'},
      {message: {v: 1, type: 'complete', labId: 'arcade', result: {outcome: 'completed'}, evidence: '3/3'}, origin: 'https://academy.example'},
    ]);
  });

  it('keeps its first binding when a second init names another lab', () => {
    const {hub, deliver} = fakeHub();
    const parent = fakeWindow();
    const lab = connectLab(hub, parent, {allowedHostOrigins: ['https://academy.example'], onInit: () => {}});
    deliver({origin: 'https://academy.example', source: parent, data: {v: 1, type: 'init', labId: 'first', config: {}, locale: 'nl'}});
    deliver({origin: 'https://academy.example', source: parent, data: {v: 1, type: 'init', labId: 'second', config: {}, locale: 'nl'}});
    lab.complete({outcome: 'completed'});
    expect(parent.posted.at(-1)).toEqual({
      message: {v: 1, type: 'complete', labId: 'first', result: {outcome: 'completed'}},
      origin: 'https://academy.example',
    });
  });
});
