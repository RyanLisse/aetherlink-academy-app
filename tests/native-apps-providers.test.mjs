import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {checkRepository, providerContractProblems} from '../infra/native-apps/check-providers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const connection = {capability: 'object-storage', scope: 'app', options: ['S3-compatible'], accountOwner: 'TBD by Ryan', retention: 'open', backup: 'open', budget: 'TBD by Ryan'};
const fixture = (providers, releaseRequirements = ['object-storage']) => ({
  manifest: {apps: [{app: 'assets', releaseRequirements, providers: {envExample: 'assets.env.example', requiredEnv: ['DATABASE_URL'], requiredEnvPrefixes: ['ASSETS_STORAGE_'], connections: [connection], ...providers}}]},
  providersDoc: '## assets\n`DATABASE_URL` and `ASSETS_STORAGE_*`\n',
  readEnvExample: () => '# names only\nDATABASE_URL=\n# ASSETS_STORAGE_* open\n',
});

test('the checked-in provider contract is complete', () => {
  assert.deepEqual(checkRepository(root), []);
});

test('a complete fixture passes', () => {
  assert.deepEqual(providerContractProblems(fixture({})), []);
});

test('a filled env value fails', () => {
  const input = fixture({});
  input.readEnvExample = () => 'DATABASE_URL=postgresql://fixture.invalid/assets\n# ASSETS_STORAGE_*\n';
  assert.deepEqual(providerContractProblems(input), ['assets: env example DATABASE_URL must have an empty value']);
});

test('a required name missing from PROVIDERS.md or the env example fails', () => {
  const input = fixture({requiredEnv: ['DATABASE_URL', 'AGENT_CHAT_SHARED_SECRET']});
  assert.deepEqual(providerContractProblems(input), ['assets: AGENT_CHAT_SHARED_SECRET missing from assets.env.example', 'assets: AGENT_CHAT_SHARED_SECRET missing from PROVIDERS.md']);
});

test('a missing providers block, owner or release coverage fails', () => {
  assert.deepEqual(providerContractProblems({...fixture({}), manifest: {apps: [{app: 'assets', releaseRequirements: []}]}}), ['assets: manifest has no providers block']);
  assert.deepEqual(providerContractProblems(fixture({connections: [{...connection, budget: ''}]})), ['assets: object-storage has no budget']);
  assert.deepEqual(providerContractProblems(fixture({connections: []})), ['assets: release requirement object-storage has no provider contract']);
});

test('an enabled background worker fails', () => {
  const input = fixture({backgroundWorker: {enabled: true, prerequisites: ['single-worker-ownership']}}, ['object-storage', 'media-capacity']);
  assert.deepEqual(providerContractProblems(input), ['assets: background worker must stay disabled until its prerequisites are proven']);
});
