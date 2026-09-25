import {renderToString} from 'react-dom/server';
import {describe, expect, test} from 'vitest';
import {I18nProvider} from '../src/i18n.tsx';
import {Shell, type ConnectionState} from '../src/routes.tsx';
import {SquadPanel} from '../src/squad/SquadPanel.tsx';
import {FacilitatorReleasePanel} from '../src/release/FacilitatorReleasePanel.tsx';
import {JoinForm} from '../src/squad/JoinForm.tsx';
import {SquadRoster} from '../src/squad/SquadRoster.tsx';
import {RoleBadge} from '../src/squad/RoleBadge.tsx';
import {ReleasePanel} from '../src/release/ReleasePanel.tsx';

const shell = (pathname: string) =>
  renderToString(
    <I18nProvider initialLocale="en" storage={{getItem: () => null, setItem: () => {}}}>
      <Shell pathname={pathname} navigate={() => {}} connection={{kind: 'loading'} satisfies ConnectionState} />
    </I18nProvider>,
  );

describe('AET-27 soft route mounts', () => {
  test('squad route mounts JoinForm', () => {
    const html = shell('/');
    expect(html).toContain('data-mounted="join"');
    expect(html).toContain('Room code');
    expect(html).toContain('>Join</button>');
    expect(html).not.toContain('data-route="squad"');
  });

  test('building blocks render', () => {
    expect(renderToString(<JoinForm onJoin={() => {}} />)).toContain('squad-join');
    expect(
      renderToString(
        <SquadRoster
          room={{
            id: 'r1',
            code: 'ABCD',
            name: 'Squad ABCD',
            mode: 'squad',
            members: [{id: '1', name: 'Ada', role: 'Driver', online: true}],
            me: {id: '2', name: 'Sam', role: 'Navigator'},
          }}
        />,
      ),
    ).toContain('squad-role-driver');
    expect(renderToString(<RoleBadge role="Facilitator" />)).toContain('Facilitator');
  });

  test('SquadPanel SSR shows join (no sessionStorage)', () => {
    expect(renderToString(<SquadPanel />)).toContain('data-mounted="join"');
  });
});

describe('AET-28 soft release panel mount', () => {
  test('coach route mounts ReleasePanel', () => {
    const html = shell('/coach');
    expect(html).toContain('data-mounted="release-panel"');
    expect(html).toContain('Lesson release');
    expect(html).toContain('Release now');
    expect(html).toContain('data-state="released"');
    expect(html).toContain('data-state="locked"');
  });

  test('FacilitatorReleasePanel exposes schedule controls for locked lessons', () => {
    const html = renderToString(<FacilitatorReleasePanel />);
    expect(html).toContain('Schedule +1h');
    expect(html).toContain('Day 1 · Lesson 1');
  });

  test('ReleasePanel building block', () => {
    const html = renderToString(
      <ReleasePanel
        lessons={[
          {
            lessonId: 'x',
            title: 'X',
            state: 'scheduled',
            scheduledAt: 1,
            scheduleRevision: 1,
            releasedAt: null,
            releasedBy: null,
          },
        ]}
        onRelease={() => {}}
        onSchedule={() => {}}
        onCancelSchedule={() => {}}
      />,
    );
    expect(html).toContain('Cancel schedule');
  });
});
