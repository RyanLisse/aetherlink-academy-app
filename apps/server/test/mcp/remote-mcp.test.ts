import {afterEach, describe, expect, test} from 'vitest';
import {Client} from '@modelcontextprotocol/client';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {startMcpLab, type LabFixture} from '../../src/mcp/lab-server.ts';
import {LOCKED_LESSON_DENIAL, lockedLessonDenialBody} from '../../src/mcp/denial.ts';

describe('AET-44 streamable HTTP MCP', () => {
  let lab: LabFixture;
  const clients: Client[] = [];

  afterEach(async () => {
    for (const c of clients.splice(0)) await c.close().catch(() => undefined);
    if (lab) await lab.close();
  });

  const connect = async (token: string) => {
    const client = new Client({name: 'aet-44-test', version: '1'});
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`http://${lab.host}:${lab.port}/mcp`), {
        requestInit: {headers: {authorization: `Bearer ${token}`}},
      }),
    );
    clients.push(client);
    return client;
  };

  const tool = async (client: Client, name: string, args: Record<string, unknown> = {}) => {
    const result = await client.callTool({name, arguments: args});
    const text = (result.content as Array<{type: string; text: string}>)[0]?.text ?? '';
    return {result, json: JSON.parse(text) as Record<string, unknown>, isError: Boolean(result.isError)};
  };

  test('rejects missing/invalid/revoked tokens; tools include participant set', async () => {
    lab = await startMcpLab();
    expect((await fetch(`http://${lab.host}:${lab.port}/mcp`, {method: 'POST', body: '{}'})).status).toBe(401);
    expect(
      (
        await fetch(`http://${lab.host}:${lab.port}/mcp`, {
          method: 'POST',
          headers: {authorization: 'Bearer invalid', 'content-type': 'application/json'},
          body: '{}',
        })
      ).status,
    ).toBe(401);

    const client = await connect(lab.tokens.mcp);
    const names = (await client.listTools()).tools.map((t) => t.name).sort();
    for (const required of [
      'get_lesson',
      'get_current_slide',
      'get_assignment',
      'submit_evidence',
      'open_hint',
      'get_my_progress',
      'get_connection_state',
      'get_mission',
      'get_document',
      'search_knowledge',
      'suggest_document',
    ]) {
      expect(names).toContain(required);
    }
  });

  test('get_current_slide matches browser lab view (context parity)', async () => {
    lab = await startMcpLab();
    const browser = (await (await fetch(`http://${lab.host}:${lab.port}/lab/browser-view`)).json()) as {
      slideIndex: number;
      title: string;
      viewedRevision: number | null;
      latestPublishedRevision: number | null;
    };
    const client = await connect(lab.tokens.mcp);
    const {json, isError} = await tool(client, 'get_current_slide');
    expect(isError).toBe(false);
    expect(json.slideIndex).toBe(browser.slideIndex);
    expect(json.title).toBe(browser.title);
    expect(json.viewedRevision).toBe(browser.viewedRevision);
    expect(json.latestPublishedRevision).toBe(browser.latestPublishedRevision);
    expect(json.slideIndex).toBe(lab.browserSlide.index);
    expect(json.title).toBe(lab.browserSlide.title);
  });

  test('unreleased lesson denied via MCP and HTTP with same shape', async () => {
    lab = await startMcpLab();
    const lockedId = 'lesson-locked-99';
    await lab.setReleased(lockedId, false);

    const httpRes = await fetch(`http://${lab.host}:${lab.port}/http/lesson?lessonId=${lockedId}`);
    expect(httpRes.status).toBe(LOCKED_LESSON_DENIAL.status);
    const httpBody = await httpRes.json();
    expect(httpBody).toEqual(lockedLessonDenialBody());

    const client = await connect(lab.tokens.mcp);
    const {json, isError} = await tool(client, 'get_lesson', {lessonId: lockedId});
    expect(isError).toBe(true);
    expect(json).toEqual(lockedLessonDenialBody());
  });

  test('token revoke → next MCP call fails', async () => {
    lab = await startMcpLab();
    const client = await connect(lab.tokens.mcp);
    expect((await client.listTools()).tools.length).toBeGreaterThan(5);
    lab.revokeMcp();
    await expect(client.listTools()).rejects.toBeTruthy();
    expect(
      (
        await fetch(`http://${lab.host}:${lab.port}/mcp`, {
          method: 'POST',
          headers: {authorization: `Bearer ${lab.tokens.mcp}`, 'content-type': 'application/json'},
          body: '{}',
        })
      ).status,
    ).toBe(401);
  });
});
