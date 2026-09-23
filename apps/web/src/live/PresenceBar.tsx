import type {PresenceSnapshot} from './types.ts';

export function PresenceBar({presence}: {readonly presence: PresenceSnapshot}) {
  return (
    <div className="live-presence" data-testid="presence-bar" aria-label="Participants">
      <span data-testid="presence-following">Volgt: {presence.following.map((p) => p.name).join(', ') || '—'}</span>
      <span data-testid="presence-detached">Los: {presence.detached.map((p) => p.name).join(', ') || '—'}</span>
      <span data-testid="presence-evidence">Bewijs: {presence.evidence.map((p) => p.name).join(', ') || '—'}</span>
    </div>
  );
}
