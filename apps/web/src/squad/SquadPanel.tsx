import {useCallback, useMemo, useState} from 'react';
import {JoinForm} from './JoinForm.tsx';
import {SquadRoster} from './SquadRoster.tsx';
import type {SquadMemberView, SquadRoomView, SquadRole} from './types.ts';

const SEAT_KEY = 'academy.squad.seat';

interface Seat {
  readonly code: string;
  readonly name: string;
  readonly memberId: string;
  readonly role: SquadRole | 'Facilitator';
}

const readSeat = (): Seat | null => {
  try {
    const raw = sessionStorage.getItem(SEAT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Seat;
  } catch {
    return null;
  }
};

const writeSeat = (seat: Seat | null) => {
  if (!seat) {
    sessionStorage.removeItem(SEAT_KEY);
    return;
  }
  sessionStorage.setItem(SEAT_KEY, JSON.stringify(seat));
};

const demoPeers = (meId: string): ReadonlyArray<SquadMemberView> => {
  const peers: ReadonlyArray<SquadMemberView> = [
    {id: 'peer-ada', name: 'Ada', role: 'Driver', online: true},
    {id: 'peer-nik', name: 'Nik', role: 'Navigator', online: true},
    {id: 'peer-lee', name: 'Lee', role: null, online: false},
  ];
  return peers.filter((peer) => peer.id !== meId);
};

/** Thin classroom mount for JoinForm / SquadRoster / RoleBadge (AET-27 soft). Soft rejoin: same code+name restores seat. */
export function SquadPanel() {
  const [seat, setSeat] = useState<Seat | null>(() => (typeof sessionStorage === 'undefined' ? null : readSeat()));

  const onJoin = useCallback(async (code: string, name: string) => {
    if (!code || !name) return;
    const prior = readSeat();
    const soft =
      prior && prior.code.toLowerCase() === code.toLowerCase() && prior.name.toLowerCase() === name.toLowerCase()
        ? prior
        : null;
    const next: Seat = soft ?? {
      code,
      name,
      memberId: `m-${Math.random().toString(36).slice(2, 10)}`,
      role: 'Navigator',
    };
    writeSeat(next);
    setSeat(next);
  }, []);

  const onLeave = useCallback(() => {
    writeSeat(null);
    setSeat(null);
  }, []);

  const room: SquadRoomView | null = useMemo(() => {
    if (!seat) return null;
    const me: SquadMemberView = {
      id: seat.memberId,
      name: seat.name,
      role: seat.role === 'Facilitator' ? 'Facilitator' : seat.role,
      online: true,
    };
    return {
      id: `room-${seat.code.toLowerCase()}`,
      code: seat.code.toUpperCase(),
      name: `Squad ${seat.code.toUpperCase()}`,
      mode: 'squad',
      members: [...demoPeers(seat.memberId), me],
      me: {id: me.id, name: me.name, role: me.role ?? null},
    };
  }, [seat]);

  if (!room) {
    return (
      <div className="squad-panel" data-mounted="join">
        <p className="eyebrow">Soft rejoin</p>
        <p className="lede">Enter the room code and the same display name to restore your seat.</p>
        <JoinForm onJoin={onJoin} />
      </div>
    );
  }

  return (
    <div className="squad-panel" data-mounted="roster">
      <SquadRoster room={room} />
      <button type="button" className="squad-leave" onClick={onLeave}>
        Leave room
      </button>
    </div>
  );
}
