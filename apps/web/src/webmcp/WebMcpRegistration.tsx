import {useEffect, useState} from 'react';
import {registerWebMcpTools, PARTICIPANT_TOOL_NAMES} from './register.ts';
import type {ActionDescriptor} from '@academy/actions/web-mcp';
import type {McpConnectionState} from './types.ts';

export interface WebMcpRegistrationProps {
  readonly descriptors?: ReadonlyArray<ActionDescriptor>;
  /** POST /actions/:name with session cookie / bearer. */
  readonly invokeUrl?: string;
  readonly authToken?: string | null;
  readonly connectionState?: McpConnectionState;
  readonly onRegistered?: (names: ReadonlyArray<string>) => void;
}

const defaultInvoke =
  (invokeUrl: string, authToken?: string | null) =>
  async (name: string, payload: unknown, confirmationToken?: string) => {
    const response = await fetch(`${invokeUrl.replace(/\/$/, '')}/actions/${name}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(authToken ? {authorization: authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`} : {}),
        ...(confirmationToken ? {'x-confirmation-token': confirmationToken} : {}),
      },
      body: JSON.stringify(payload ?? {}),
      credentials: 'same-origin',
    });
    const data = await response.json();
    if (!response.ok) throw new Error((data as {message?: string}).message || `HTTP ${response.status}`);
    return data;
  };

/**
 * Mount in the participant follow view. Registers tools when WebMCP is available;
 * shows configured / connected / verified without starting a model in-page.
 */
export function WebMcpRegistration(props: WebMcpRegistrationProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [registered, setRegistered] = useState<ReadonlyArray<string>>([]);
  const state = props.connectionState ?? 'configured';

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const descriptors =
        props.descriptors ??
        PARTICIPANT_TOOL_NAMES.map((name) => ({
          name,
          description: `Academy tool ${name}`,
          scope: 'participant',
          intent: name === 'submit_evidence' ? 'explicit' : 'read',
          inputSchema: {type: 'object'},
          outputSchema: {type: 'object'},
        }));
      const invoke = defaultInvoke(props.invokeUrl ?? '', props.authToken);
      const result = await registerWebMcpTools({descriptors, invoke});
      if (cancelled) return;
      setSupported(result.supported);
      setRegistered(result.registered);
      props.onRegistered?.(result.registered);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [props.descriptors, props.invokeUrl, props.authToken]);

  return (
    <div className="webmcp-registration" data-testid="webmcp-registration" data-connection={state}>
      <p className="webmcp-status" data-testid="webmcp-connection-state">
        MCP: <strong>{state}</strong>
        {supported === false && <span> · browser heeft geen WebMCP</span>}
        {supported && registered.length > 0 && <span> · {registered.length} tools</span>}
      </p>
      <p className="webmcp-note">Geen chatvenster, geen API-key, geen modelaanroep in deze view.</p>
      <p className="webmcp-connect-claude" data-testid="connect-claude-copy">
        Connect your Claude — coach already knows where you are.
      </p>
    </div>
  );
}
