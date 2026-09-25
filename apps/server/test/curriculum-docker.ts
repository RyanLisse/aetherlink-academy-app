import {createConnection} from 'node:net';
import {randomUUID} from 'node:crypto';
import {docker, dockerAvailable, waitUntil} from './docker.ts';

export {docker, dockerAvailable, waitUntil};

const POSTGRES_USER = 'academy_curriculum';
const POSTGRES_PASSWORD = 'academy-curriculum-test';
const POSTGRES_DATABASE = 'academy_curriculum';
const OWNER_LABEL = 'academy.curriculum-db.owner';

export interface CurriculumPostgresHandle {
  readonly name: string;
  readonly owner: string;
  readonly port: number;
  readonly url: string;
}

const tryDocker = (...args: string[]): string | null => {
  try {
    return docker(...args);
  } catch {
    return null;
  }
};

const tcpReady = (port: number): Promise<boolean> => new Promise((resolve) => {
  const socket = createConnection({host: '127.0.0.1', port});
  const finish = (ready: boolean): void => {
    socket.destroy();
    resolve(ready);
  };
  socket.once('connect', () => finish(true));
  socket.once('error', () => finish(false));
  socket.setTimeout(1_000, () => finish(false));
});

const boundPort = (name: string): number => {
  const value = tryDocker('inspect', '--format', '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}', name);
  const port = value === null ? Number.NaN : Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) throw new Error(`could not determine the loopback port for ${name}`);
  return port;
};

const removeOwned = (name: string, owner: string): void => {
  const label = tryDocker('inspect', '--format', `{{index .Config.Labels "${OWNER_LABEL}"}}`, name);
  if (label === null) return;
  if (label !== owner) return;
  tryDocker('rm', '--force', name);
};

export const startCurriculumPostgres = async (): Promise<CurriculumPostgresHandle> => {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 16);
  const handle: CurriculumPostgresHandle = {
    name: `academy-curriculum-db-${suffix}${process.env.ACADEMY_TEST_CONTAINER_SUFFIX ?? ''}`,
    owner: `curriculum-db-test-${randomUUID()}`,
    port: 0,
    url: '',
  };
  try {
    docker(
      'run', '--detach', '--name', handle.name, '--label', `${OWNER_LABEL}=${handle.owner}`,
      '--publish', '127.0.0.1::5432',
      '--env', `POSTGRES_USER=${POSTGRES_USER}`, '--env', `POSTGRES_PASSWORD=${POSTGRES_PASSWORD}`, '--env', `POSTGRES_DB=${POSTGRES_DATABASE}`,
      'postgres:16',
    );
    const port = boundPort(handle.name);
    const readyHandle: CurriculumPostgresHandle = {...handle, port, url: `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:${port}/${POSTGRES_DATABASE}?sslmode=disable`};
    await waitUntil('curriculum postgres TCP port', () => tcpReady(port), 60_000, 250);
    await waitUntil('curriculum postgres accepting TCP connections', () => tryDocker('exec', readyHandle.name, 'pg_isready', '-h', '127.0.0.1', '-U', POSTGRES_USER, '-d', POSTGRES_DATABASE) !== null, 60_000, 250);
    return readyHandle;
  } catch (error) {
    removeOwned(handle.name, handle.owner);
    throw error;
  }
};

export const stopCurriculumPostgres = (handle: CurriculumPostgresHandle): void => {
  removeOwned(handle.name, handle.owner);
};
