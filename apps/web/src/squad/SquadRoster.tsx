import {RoleBadge} from './RoleBadge.tsx';
import type {SquadRoomView} from './types.ts';

export function SquadRoster({room}: {readonly room: SquadRoomView}) {
  return (
    <section className="squad-roster" aria-label="Squad roster">
      <header>
        <h2>{room.name}</h2>
        <p>Code {room.code}</p>
      </header>
      <ul>
        {room.members.map((member) => (
          <li key={member.id} data-online={member.online ? 'true' : 'false'}>
            <span>{member.name}</span>
            {member.help ? <span className="help">help</span> : null}
          </li>
        ))}
      </ul>
      <footer>
        You: {room.me.name} {room.me.role === 'Facilitator' ? <RoleBadge role={room.me.role} /> : null}
      </footer>
    </section>
  );
}
