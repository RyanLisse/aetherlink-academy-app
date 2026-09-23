import {describe, expect, test} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {WebMcpRegistration} from '../src/webmcp/WebMcpRegistration.tsx';
import {PARTICIPANT_TOOL_NAMES} from '../src/webmcp/register.ts';

describe('WebMcpRegistration', () => {
  test('renders connection state; no in-page model call', () => {
    const html = renderToStaticMarkup(createElement(WebMcpRegistration, {connectionState: 'verified'}));
    expect(html).toContain('verified');
    expect(html).toContain('data-testid="webmcp-registration"');
    expect(html).toContain('Geen chatvenster');
  });

  test('participant tool names match AET-44 set', () => {
    expect([...PARTICIPANT_TOOL_NAMES].sort()).toEqual(
      [
        'get_assignment',
        'get_connection_state',
        'get_current_slide',
        'get_lesson',
        'get_my_progress',
        'open_hint',
        'submit_evidence',
      ].sort(),
    );
  });
});
