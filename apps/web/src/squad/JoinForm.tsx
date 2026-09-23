import {useState} from 'react';

export interface JoinFormProps {
  readonly onJoin: (code: string, name: string) => void | Promise<void>;
}

/** Soft rejoin: same display name + room code restores the seat server-side. */
export function JoinForm({onJoin}: JoinFormProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  return (
    <form
      className="squad-join"
      onSubmit={(event) => {
        event.preventDefault();
        void onJoin(code.trim(), name.trim());
      }}
    >
      <label>
        Room code
        <input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" required />
      </label>
      <label>
        Display name
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname" required />
      </label>
      <button type="submit">Join / rejoin</button>
    </form>
  );
}
