import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {after, describe, test} from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const workflowPath = path.join(root, '.github/workflows/openship-academy.yml');
const workflow = readFileSync(workflowPath, 'utf8');
const scratch = mkdtempSync(path.join(tmpdir(), 'openship-kit-'));
after(() => rmSync(scratch, {recursive: true, force: true}));

const topLevelBlock = (name) => {
  const lines = workflow.split('\n');
  const start = lines.findIndex((line) => line === `${name}:`);
  assert.notEqual(start, -1, `workflow has a top-level ${name}: block`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^\S/.test(line));
  return rest.slice(0, end === -1 ? rest.length : end).join('\n');
};

describe('openship-academy workflow', () => {
  test('is triggered by workflow_dispatch only', () => {
    const on = topLevelBlock('on');
    const triggers = on.split('\n').filter((line) => /^ {2}\S/.test(line)).map((line) => line.trim().replace(/:.*/, ''));
    assert.deepEqual(triggers, ['workflow_dispatch']);
  });

  test('offers exactly the seven ordered steps', () => {
    const options = topLevelBlock('on').match(/options:\n((?:\s+- .+\n?)+)/)[1].split('\n').map((line) => line.trim().replace(/^- /, '')).filter(Boolean);
    assert.deepEqual(options, ['plan', 'deploy', 'migrate-data', 'verify', 'cutover', 'decommission', 'domain']);
  });

  test('destructive steps demand the typed phrase before any host access', () => {
    const guard = workflow.match(/- name: Require confirmation phrase\n[\s\S]*?run: \|\n([\s\S]*?)(?=\n {6}- name:)/)[1].replace(/^ {10}/gm, '');
    const exit = (STEP, CONFIRM) => spawnSync('bash', ['-c', guard], {env: {PATH: process.env.PATH, STEP, CONFIRM}}).status;
    assert.deepEqual(
      ['plan', 'deploy', 'migrate-data', 'verify', 'cutover', 'decommission'].map((step) => [step, exit(step, '')]),
      [['plan', 0], ['deploy', 0], ['migrate-data', 1], ['verify', 0], ['cutover', 1], ['decommission', 1]],
    );
    assert.equal(exit('migrate-data', 'academy-openship-migrate-data'), 0);
    assert.equal(exit('decommission', 'academy-openship-decommission'), 0);
    assert.equal(exit('decommission', 'academy-openship-cutover'), 1);
    assert.equal(exit('rm-everything', ''), 1);
    assert.ok(workflow.indexOf('Require confirmation phrase') < workflow.indexOf('appleboy/ssh-action'), 'guard runs before SSH');
  });

  test('never interpolates or prints the OpenShip token', () => {
    const uses = workflow.match(/secrets\.OPENSHIP_TOKEN/g) || [];
    assert.equal(uses.length, 1, 'token is read in exactly one env mapping');
    assert.match(workflow, /^\s+OPENSHIP_TOKEN: \$\{\{ secrets\.OPENSHIP_TOKEN \}\}$/m);
    // The one real leak we had: appleboy `envs:` puts values into the remote `bash -c export`
    // command line, readable in the host process list.
    for (const line of workflow.split('\n').filter((l) => /^\s*envs:/.test(l))) assert.doesNotMatch(line, /OPENSHIP_TOKEN/, line);
    // Allowed: piping it into ssh's stdin, and reading it back from the 0600 file on the host.
    const allowed = [/^\s*printf '%s' "\$OPENSHIP_TOKEN" \| ssh /, /^\s*OPENSHIP_TOKEN="\$\(cat "\$KIT_HOME\/\.token"\)"$/];
    for (const line of workflow.split('\n')) {
      if (/\b(echo|printf|cat)\b/.test(line) && /OPENSHIP_TOKEN/.test(line)) assert.ok(allowed.some((re) => re.test(line)), line);
    }
    assert.doesNotMatch(workflow, /set -[a-zA-Z]*x/);
    assert.doesNotMatch(workflow, /debug:\s*true/);
  });
});

describe('lib.sh OpenShip API session', () => {
  const token = 'opsh_pat_synthetic0123456789';
  const callApi = (tokenValue) => {
    const bin = mkdtempSync(path.join(scratch, 'curl-'));
    writeFileSync(path.join(bin, 'curl'), `#!/usr/bin/env bash
printf '%s\\n' "$*" > "${bin}/argv.log"
for arg in "$@"; do [[ "$arg" == @*auth.header ]] && cat "\${arg#@}" > "${bin}/header.log"; done
echo '[{"id":"proj_1","slug":"academy"}]'
`);
    chmodSync(path.join(bin, 'curl'), 0o755);
    const result = spawnSync('bash', ['-c', `source "${root}/infra/openship/lib.sh"; openship_session; [[ -z "\${OPENSHIP_TOKEN:-}" ]] || exit 9; project_id`], {
      encoding: 'utf8',
      env: {...process.env, PATH: `${bin}:${process.env.PATH}`, OPENSHIP_TOKEN: tokenValue},
    });
    const read = (name) => (existsSync(path.join(bin, name)) ? readFileSync(path.join(bin, name), 'utf8') : '');
    return {result, argv: read('argv.log'), header: read('header.log')};
  };

  test('sends the token only through a header file, never argv, and finds the project by slug', () => {
    const {result, argv, header} = callApi(token);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'proj_1\n');
    assert.equal(header, `Authorization: Bearer ${token}\n`);
    assert.ok(argv.includes('http://127.0.0.1:4000/api/projects'), argv);
    assert.equal(argv.includes(token), false);
  });

  test('refuses a value that is not an OpenShip personal access token', () => {
    const {result, argv} = callApi('ghp_notopenship');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /not an OpenShip personal access token/);
    assert.equal(argv, '');
  });
});

function fakeDockerBin(state) {
  const bin = path.join(scratch, `bin-${Math.random().toString(16).slice(2)}`);
  mkdirSync(bin);
  const log = path.join(bin, 'calls.log');
  writeFileSync(log, '');
  writeFileSync(path.join(bin, 'docker'), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "${log}"
case "$1 $2" in
  "inspect --type")
    name="\${@: -1}"
    case "$name" in ${state.legacy.join('|')}) ;; *) exit 1 ;; esac
    if [[ "$*" == *Mounts* ]]; then
      case "$name" in
        academy-postgres) echo academy-postgres-data ;;
        academy-redis) echo academy-redis-data ;;
      esac
    fi ;;
  "ps -a")
    if [[ "$*" == *name=^academy-wave-* ]]; then printf '%s\\n' academy-wave-redis-1 academy-wave-app-1; fi
    if [[ "$*" == *volume=${state.sharedVolume ?? 'none'}* ]]; then echo openship-postgres-1; fi ;;
  "volume ls") echo academy-wave_pgdata ;;
  "network ls") echo academy-wave_default ;;
esac
exit 0
`);
  chmodSync(path.join(bin, 'docker'), 0o755);
  return {bin, calls: () => readFileSync(log, 'utf8').trim().split('\n').filter(Boolean)};
}

function fixture({marker = true, tamper = false} = {}) {
  const dir = mkdtempSync(path.join(scratch, 'host-'));
  const backups = path.join(dir, 'backups');
  const wave = path.join(dir, 'aetherlink-academy-wave');
  mkdirSync(backups);
  mkdirSync(wave);
  const dump = path.join(backups, '20260926T120000Z.dump');
  writeFileSync(dump, 'PGDMP synthetic test dump');
  const sha = createHash('sha256').update(tamper ? 'other' : 'PGDMP synthetic test dump').digest('hex');
  if (marker) writeFileSync(path.join(backups, 'verify-passed.env'), `status=passed\ndump=${dump}\ndump_sha256=${sha}\n`);
  return {backups, wave, dump};
}

const run = (args, {bin, backups, wave}) =>
  spawnSync('bash', [path.join(root, 'infra/openship/decommission.sh'), ...args], {
    encoding: 'utf8',
    env: {...process.env, PATH: `${bin}:${process.env.PATH}`, ACADEMY_BACKUP_DIR: backups, ACADEMY_WAVE_DIR: wave},
  });

const mutating = (calls) => calls.filter((call) => /^(stop|rm|volume rm|network rm)\b/.test(call));

describe('decommission.sh', () => {
  const legacy = ['academy-app', 'academy-postgres', 'academy-redis'];

  test('dry run is the default and prints the exact removal plan without touching anything', () => {
    const docker = fakeDockerBin({legacy});
    const host = fixture();
    const result = run([], {...docker, ...host});
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, [
      `Verified dump kept: ${host.dump}`,
      'Containers to stop and remove:',
      '  academy-app',
      '  academy-postgres',
      '  academy-redis',
      '  academy-wave-app-1',
      '  academy-wave-redis-1',
      'Volumes to remove:',
      '  academy-postgres-data',
      '  academy-redis-data',
      '  academy-wave_pgdata',
      'Networks to remove:',
      '  academy-wave_default',
      'Directory to remove:',
      `  ${host.wave}`,
      'Dry run. Nothing was removed. Re-run with --execute to apply.',
      '',
    ].join('\n'));
    assert.deepEqual(mutating(docker.calls()), []);
    assert.ok(existsSync(host.wave));
  });

  test('refuses without a passing verify marker', () => {
    const docker = fakeDockerBin({legacy});
    const host = fixture({marker: false});
    const result = run(['--execute'], {...docker, ...host});
    assert.equal(result.status, 1);
    assert.match(result.stderr, /no verify marker/);
    assert.deepEqual(docker.calls(), []);
  });

  test('refuses when the kept dump no longer matches the verified checksum', () => {
    const docker = fakeDockerBin({legacy});
    const host = fixture({tamper: true});
    const result = run(['--execute'], {...docker, ...host});
    assert.equal(result.status, 1);
    assert.match(result.stderr, /checksum does not match/);
    assert.deepEqual(docker.calls(), []);
  });

  test('refuses to delete a volume that a surviving container still mounts', () => {
    const docker = fakeDockerBin({legacy, sharedVolume: 'academy-postgres-data'});
    const host = fixture();
    const result = run(['--execute'], {...docker, ...host});
    assert.equal(result.status, 1);
    assert.match(result.stderr, /academy-postgres-data is also used by openship-postgres-1/);
    assert.deepEqual(mutating(docker.calls()), []);
  });

  test('--execute removes exactly the planned objects and keeps the dump', () => {
    const docker = fakeDockerBin({legacy: ['academy-app']});
    const host = fixture();
    const result = run(['--execute'], {...docker, ...host});
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(mutating(docker.calls()), [
      'stop academy-app', 'rm academy-app',
      'stop academy-wave-app-1', 'rm academy-wave-app-1',
      'stop academy-wave-redis-1', 'rm academy-wave-redis-1',
      'volume rm academy-wave_pgdata',
      'network rm academy-wave_default',
    ]);
    assert.equal(existsSync(host.wave), false);
    assert.equal(existsSync(host.dump), true);
  });

  test('rejects unknown flags', () => {
    const docker = fakeDockerBin({legacy});
    const result = run(['--yes'], {...docker, ...fixture()});
    assert.equal(result.status, 2);
  });
});

test('academy.services.json mirrors academy.compose.yaml (reference fixture)', () => {
  const kit = new URL('../infra/openship/', import.meta.url);
  const compose = readFileSync(new URL('academy.compose.yaml', kit), 'utf8');
  const {services} = JSON.parse(readFileSync(new URL('academy.services.json', kit), 'utf8'));
  assert.deepEqual(services.map((service) => service.name), ['app', 'postgres', 'redis']);
  const drift = services.flatMap((service) => [
    `  ${service.name}:`, service.image && `image: ${service.image}`,
    ...(service.ports ?? []).map((port) => `"${port}"`), ...(service.volumes ?? []).map((volume) => `- ${volume}`),
    ...(service.dependsOn ?? []).map((dep) => `- ${dep}`), ...Object.values(service.environment ?? {}),
  ].filter(Boolean).filter((needle) => !compose.includes(needle)).map((needle) => `${service.name}: ${needle}`));
  assert.deepEqual(drift, []);
  assert.ok(services.every((service) => service.exposed === false), 'no service asks for a free .opsh.io domain');
});

describe('deploy does not call /services/sync', () => {
  const step = readFileSync(path.join(root, 'infra/openship/step.sh'), 'utf8');
  const research = readFileSync(path.join(root, 'infra/openship/RESEARCH.md'), 'utf8');

  test('step.sh never POSTs /services/sync (project:*:create PAT cannot assert service *)', () => {
    // OpenShip 0.7.2 tags POST /projects/:id/services/sync as project:service:write +
    // collection:true → permission.assert({service,"*",write}). A runbook PAT with only
    // project:*:create 404s NotFoundError("service","*"). Deploy-time composePath sync
    // (build.service.ts) persists the rows instead. Comments may mention the pitfall;
    // executable api calls must not.
    assert.doesNotMatch(step, /^\s*api\s+POST\s+"[^"]*services\/sync/m);
    assert.doesNotMatch(step, /^\s*say\s+"Syncing services/m);
    assert.match(step, /composePath/);
    assert.match(step, /service "\*"/);
  });

  test('RESEARCH.md documents the /services/sync permission pitfall', () => {
    assert.match(research, /services\/sync/);
    assert.match(research, /service.*"\*".*write|\{service,"\*",write\}/);
    assert.match(research, /does \*\*not\*\* call that endpoint|does not call that endpoint/i);
  });

  test('after ready, deploy lists services and dies on an empty services-type project', () => {
    assert.match(step, /GET "\/projects\/\$id\/services"/);
    assert.match(step, /zero services after deploy/);
  });
});
