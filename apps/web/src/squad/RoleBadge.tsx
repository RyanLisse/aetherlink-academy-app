import type {SquadRole} from './types.ts';

export function RoleBadge({role}: {readonly role: SquadRole | 'Facilitator'}) {
  if (!role) return null;
  return <span className={`squad-role squad-role-${role.toLowerCase()}`}>{role}</span>;
}
