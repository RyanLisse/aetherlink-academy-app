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
    assert.ok(argv.includes('http://127.0.0.1:4000/api/projects?perPage=100'), argv);
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

describe('compose ports and project readiness (OpenShip sibling)', () => {
  const kit = new URL('../infra/openship/', import.meta.url);
  const compose = readFileSync(new URL('academy.compose.yaml', kit), 'utf8');
  const project = JSON.parse(readFileSync(new URL('academy.project.json', kit), 'utf8'));
  const {services} = JSON.parse(readFileSync(new URL('academy.services.json', kit), 'utf8'));
  const research = readFileSync(new URL('RESEARCH.md', kit), 'utf8');
  const step = readFileSync(path.join(root, 'infra/openship/step.sh'), 'utf8');

  test('app ports are hardcoded 127.0.0.1:4327:4317 (no bash :- in ports)', () => {
    const app = services.find((service) => service.name === 'app');
    assert.deepEqual(app.ports, ['127.0.0.1:4327:4317']);
    assert.match(compose, /ports:\n\s+-\s+"127\.0\.0\.1:4327:4317"/);
    // Executable ports lines only — comments may mention the ParseAddr pitfall.
    const portLines = compose.split('\n').filter((line) => /^\s+-\s+"/.test(line) && line.includes(':'));
    assert.deepEqual(portLines.map((line) => line.trim()), ['- "127.0.0.1:4327:4317"']);
    assert.ok(portLines.every((line) => !line.includes('${') && !line.includes(':-')));
  });

  test('app build context is repo-root . (not ../..)', () => {
    const app = services.find((service) => service.name === 'app');
    assert.equal(app.build, '.');
    assert.match(compose, /build:\n(?:\s+#.*\n)*\s+context:\s+\.\n\s+dockerfile:\s+Dockerfile/);
    assert.doesNotMatch(compose, /context:\s+\.\.\/\.\./);
    assert.doesNotMatch(JSON.stringify(services), /"build":"\.\.\/\.\."/);
  });

  test('project readiness probes /game/health without forcing port 4317 on every service', () => {
    assert.equal(project.readiness?.enabled, true);
    assert.equal(project.readiness?.path, '/game/health');
    assert.equal(project.readiness?.onFailure, 'fail');
    assert.equal(Object.hasOwn(project.readiness, 'port'), false);
  });

  test('step.sh upserts ACADEMY_PORT_BIND as IP-only 127.0.0.1', () => {
    assert.match(step, /ACADEMY_PORT_BIND=127\.0\.0\.1/);
    assert.doesNotMatch(step, /ACADEMY_PORT_BIND=%s.*port_bind|port_bind.*"\$\(port_bind\)".*ACADEMY_PORT_BIND/);
    assert.doesNotMatch(step, /printf '[^']*ACADEMY_PORT_BIND=%s/);
  });

  test('deploy PATCHes project readiness from academy.project.json (clears stale port)', () => {
    assert.match(step, /academy\.project\.json/);
    assert.match(step, /cp "\$KIT_DIR\/academy\.project\.json" "\$OPENSHIP_TMP\/academy\.project\.json"/);
    assert.match(step, /readiness: \.\[1\]\.readiness/);
    assert.match(step, /"\$OPENSHIP_TMP\/endpoints\.json" "\$OPENSHIP_TMP\/academy\.project\.json"/);
    assert.match(step, /project\.patch\.json/);
  });

  test('RESEARCH.md documents ParseAddr ports pitfall and per-service readiness', () => {
    assert.match(research, /ParseAddr/);
    assert.match(research, /127\.0\.0\.1:4327:4317/);
    assert.match(research, /each.*compose service|each\*\* compose service/i);
    assert.match(research, /readiness\.port/);
  });
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

describe('deploy requires github_repository grant on scoped PAT', () => {
  const lib = readFileSync(path.join(root, 'infra/openship/lib.sh'), 'utf8');
  const research = readFileSync(path.join(root, 'infra/openship/RESEARCH.md'), 'utf8');
  const runbook = readFileSync(path.join(root, 'docs/runbooks/single-academy-openship.md'), 'utf8');
  const step = readFileSync(path.join(root, 'infra/openship/step.sh'), 'utf8');

  test('runbook mints OPENSHIP_TOKEN with github_repository grant', () => {
    assert.match(runbook, /github_repository:RyanLisse\/aetherlink-academy-app:read/);
    assert.match(runbook, /project:\*:create/);
    assert.match(runbook, /project:proj_PTFOnZxLMEKU4ys9:read,write,admin/);
    assert.match(runbook, /GITHUB_ACCESS_DENIED/);
    assert.match(runbook, /assertGitHubRepoAccess/);
  });

  test('RESEARCH.md documents assertGitHubRepoAccess for POST \/deployments', () => {
    assert.match(research, /assertGitHubRepoAccess/);
    assert.match(research, /GITHUB_ACCESS_DENIED/);
    assert.match(research, /github_repository/);
  });

  test('lib.sh prints recreate hint on GITHUB_ACCESS_DENIED', () => {
    assert.match(lib, /GITHUB_ACCESS_DENIED/);
    assert.match(lib, /github_repository:RyanLisse\/aetherlink-academy-app:read/);
  });

  test('step.sh notes the GitHub access gate before POST \/deployments', () => {
    assert.match(step, /assertGitHubRepoAccess/);
    assert.match(step, /GITHUB_ACCESS_DENIED/);
  });
});


describe('deploy ensures / reuses existing OpenShip project', () => {
  const lib = readFileSync(path.join(root, 'infra/openship/lib.sh'), 'utf8');
  const step = readFileSync(path.join(root, 'infra/openship/step.sh'), 'utf8');
  const research = readFileSync(path.join(root, 'infra/openship/RESEARCH.md'), 'utf8');
  const runbook = readFileSync(path.join(root, 'docs/runbooks/single-academy-openship.md'), 'utf8');
  const token = 'opsh_pat_synthetic0123456789';

  test('step.sh deploy calls ensure_project_id (no bare api POST /projects)', () => {
    assert.match(step, /ensure_project_id/);
    assert.doesNotMatch(step, /^\s*api\s+POST\s+\/projects\b/m);
  });

  test('lib.sh matches by slug or name, knows Academy id, and has api_code', () => {
    assert.match(lib, /\.slug\? == \$s\) or \(\.name\? == \$s\)/);
    assert.match(lib, /proj_PTFOnZxLMEKU4ys9/);
    assert.match(lib, /api_code/);
    assert.match(lib, /ensure_project_id/);
    assert.match(lib, /409/);
  });

  test('RESEARCH and runbook document 409 reuse and do-not-delete', () => {
    assert.match(research, /409 CONFLICT/);
    assert.match(research, /scopedProjectIds|filters to granted/i);
    assert.match(runbook, /409 CONFLICT/);
    assert.match(runbook, /Do not delete|do \*\*not\*\* delete/i);
    assert.match(runbook, /proj_PTFOnZxLMEKU4ys9/);
  });

  const runEnsure = (curlBody) => {
    const bin = mkdtempSync(path.join(scratch, 'curl-ensure-'));
    const kitHome = mkdtempSync(path.join(scratch, 'kit-'));
    writeFileSync(path.join(bin, 'curl'), `#!/usr/bin/env bash
set -e
printf '%s\\n' "$*" >> "${bin}/argv.log"
${curlBody}
`);
    chmodSync(path.join(bin, 'curl'), 0o755);
    return spawnSync(
      'bash',
      ['-c', `source "${root}/infra/openship/lib.sh"; openship_session; ensure_project_id`],
      {
        encoding: 'utf8',
        env: {...process.env, PATH: `${bin}:${process.env.PATH}`, OPENSHIP_TOKEN: token, KIT_HOME: kitHome},
      },
    );
  };

  test('ensure reuses when GET list already has academy (never POSTs create)', () => {
    const result = runEnsure(`
if [[ "$*" == *"-w"*"%{http_code}"* ]]; then
  for a in "$@"; do [[ "$a" == "-o" ]] && next_o=1 && continue; [[ -n "\${next_o:-}" ]] && echo '{}' > "$a" && next_o=; done
  printf 500
  exit 0
fi
if [[ "$*" == *"/api/projects?perPage=100"* ]]; then
  echo '{"data":[{"id":"proj_PTFOnZxLMEKU4ys9","slug":"academy","name":"academy"}]}'
  exit 0
fi
echo "unexpected: $*" >&2
exit 99
`);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal(result.stdout, 'proj_PTFOnZxLMEKU4ys9');
    assert.doesNotMatch(result.stderr + result.stdout, /Creating OpenShip project/);
  });

  test('ensure creates when list is empty and POST returns 201', () => {
    const result = runEnsure(`
out=""; code_mode=0; args=("$@")
for i in "\${!args[@]}"; do
  [[ "\${args[\$i]}" == "-w" ]] && code_mode=1
  [[ "\${args[\$i]}" == "-o" ]] && out="\${args[\$((i+1))]}"
done
if [[ "$*" == *"/api/projects?perPage=100"* ]]; then
  echo '{"data":[],"total":0}'; exit 0
fi
if [[ "$*" == *"-X"*"POST"* && "$*" == *"/api/projects"* && "$*" != *"/api/projects/"* ]]; then
  body='{"data":{"id":"proj_NEWcreated01","slug":"academy","name":"academy"}}'
  [[ -n "$out" ]] && printf '%s' "$body" > "$out" || printf '%s' "$body"
  [[ "$code_mode" == 1 ]] && printf 201
  exit 0
fi
if [[ "$*" == *"/api/projects/proj_"* ]]; then
  [[ -n "$out" ]] && echo '{"error":"not found"}' > "$out"
  [[ "$code_mode" == 1 ]] && printf 404 || exit 22
  exit 0
fi
echo "unexpected: $*" >&2; exit 99
`);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal(result.stdout, 'proj_NEWcreated01');
    assert.match(result.stderr, /Creating OpenShip project academy/);
  });

  test('ensure reuses known Academy id via GET when list is empty (no create)', () => {
    const result = runEnsure(`
out=""; code_mode=0; args=("$@")
for i in "\${!args[@]}"; do
  [[ "\${args[\$i]}" == "-w" ]] && code_mode=1
  [[ "\${args[\$i]}" == "-o" ]] && out="\${args[\$((i+1))]}"
done
if [[ "$*" == *"/api/projects?perPage=100"* ]]; then
  echo '{"data":[],"total":0}'; exit 0
fi
if [[ "$*" == *"/api/projects/proj_PTFOnZxLMEKU4ys9"* ]]; then
  body='{"data":{"id":"proj_PTFOnZxLMEKU4ys9","slug":"academy","name":"academy"}}'
  [[ -n "$out" ]] && printf '%s' "$body" > "$out" || printf '%s' "$body"
  [[ "$code_mode" == 1 ]] && printf 200
  exit 0
fi
echo "unexpected: $*" >&2; exit 99
`);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal(result.stdout, 'proj_PTFOnZxLMEKU4ys9');
    assert.doesNotMatch(result.stderr, /Creating OpenShip project/);
  });

  test('ensure on 409 reuses when known id is readable after conflict', () => {
    const result = runEnsure(`
STATE_FILE="$(dirname "$(command -v curl)")/post.flag"
out=""; code_mode=0; args=("$@")
for i in "\${!args[@]}"; do
  [[ "\${args[\$i]}" == "-w" ]] && code_mode=1
  [[ "\${args[\$i]}" == "-o" ]] && out="\${args[\$((i+1))]}"
done
if [[ "$*" == *"/api/projects?perPage=100"* ]]; then
  echo '{"data":[],"total":0}'; exit 0
fi
if [[ "$*" == *"-X"*"POST"* && "$*" == *"/api/projects"* && "$*" != *"/api/projects/"* ]]; then
  touch "$STATE_FILE"
  [[ -n "$out" ]] && printf '%s' '{"error":"Project \\"academy\\" already exists","code":"CONFLICT"}' > "$out"
  [[ "$code_mode" == 1 ]] && printf 409 || exit 22
  exit 0
fi
if [[ "$*" == *"/api/projects/proj_PTFOnZxLMEKU4ys9"* ]]; then
  if [[ -f "$STATE_FILE" ]]; then
    body='{"data":{"id":"proj_PTFOnZxLMEKU4ys9","slug":"academy","name":"academy"}}'
    [[ -n "$out" ]] && printf '%s' "$body" > "$out" || printf '%s' "$body"
    [[ "$code_mode" == 1 ]] && printf 200
  else
    [[ -n "$out" ]] && echo '{"error":"not found"}' > "$out"
    [[ "$code_mode" == 1 ]] && printf 404 || exit 22
  fi
  exit 0
fi
echo "unexpected: $*" >&2; exit 99
`);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal(result.stdout, 'proj_PTFOnZxLMEKU4ys9');
    assert.match(result.stderr, /409|already exists/);
  });

  test('ensure on 409 without read access dies with grant hint (does not delete)', () => {
    const result = runEnsure(`
out=""; code_mode=0; args=("$@")
for i in "\${!args[@]}"; do
  [[ "\${args[\$i]}" == "-w" ]] && code_mode=1
  [[ "\${args[\$i]}" == "-o" ]] && out="\${args[\$((i+1))]}"
done
if [[ "$*" == *"/api/projects?perPage=100"* ]]; then
  echo '{"data":[],"total":0}'; exit 0
fi
if [[ "$*" == *"-X"*"POST"* && "$*" == *"/api/projects"* && "$*" != *"/api/projects/"* ]]; then
  [[ -n "$out" ]] && printf '%s' '{"error":"Project \\"academy\\" already exists","code":"CONFLICT"}' > "$out"
  [[ "$code_mode" == 1 ]] && printf 409 || exit 22
  exit 0
fi
if [[ "$*" == *"/api/projects/proj_PTFOnZxLMEKU4ys9"* ]]; then
  [[ -n "$out" ]] && echo '{"error":"not found"}' > "$out"
  [[ "$code_mode" == 1 ]] && printf 404 || exit 22
  exit 0
fi
echo "unexpected: $*" >&2; exit 99
`);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /409 CONFLICT/);
    assert.match(result.stderr, /project:proj_PTFOnZxLMEKU4ys9:read,write,admin/);
    assert.match(result.stderr, /Do not delete/);
  });
});

describe('docker jq file args stay under /tmp', () => {
  // lib.sh wraps jq as `docker run -v /tmp:/tmp:ro` when host jq is missing.
  // Any path argument outside /tmp is invisible inside the container (run 36265252960).
  const kitDir = path.join(root, 'infra/openship');
  const scripts = ['lib.sh', 'step.sh', 'verify.sh', 'migrate-data.sh', 'decommission.sh']
    .map((name) => ({name, text: readFileSync(path.join(kitDir, name), 'utf8')}));

  test('lib.sh docker jq mounts only /tmp', () => {
    const lib = scripts.find((s) => s.name === 'lib.sh').text;
    assert.match(lib, /jq\(\) \{ docker run --rm -i -v \/tmp:\/tmp:ro "\$JQ_IMAGE" "\$@"; \}/);
    assert.match(lib, /File arguments live under \/tmp/);
  });

  test('no jq invocation passes KIT_DIR/REPO_DIR/LEGACY_HOME path args', () => {
    // curl --data-binary @"$KIT_DIR/..." is fine (host curl). Only jq argv paths matter.
    const bad = [];
    for (const {name, text} of scripts) {
      for (const line of text.split('\n')) {
        if (!/\bjq\b/.test(line)) continue;
        // Skip comments and the need/tool presence checks.
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) continue;
        if (/\bneed\b|command -v|for tool in/.test(line)) continue;
        if (/\$KIT_DIR|\$REPO_DIR|\$LEGACY_HOME|\$BACKUP_DIR|\$KIT_HOME/.test(line)) {
          bad.push(`${name}: ${trimmed}`);
        }
      }
    }
    assert.deepEqual(bad, [], bad.join('\n'));
  });

  test('every jq file-path argument is $OPENSHIP_TMP/... or $body (mktemp)', () => {
    // Collect "$VAR/..." and bare "$body" args that are jq inputs (not redirections / curl URLs).
    const pathArg = /(?:^|[\s])("\$[A-Za-z_][A-Za-z0-9_]*\/[^"]+"|"\$body")/g;
    const allowed = (arg) => arg === '"$body"' || arg.startsWith('"$OPENSHIP_TMP/');
    const bad = [];
    for (const {name, text} of scripts) {
      for (const line of text.split('\n')) {
        const jqIdx = line.search(/\bjq\b/);
        if (jqIdx === -1) continue;
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) continue;
        if (/\bneed\b|command -v|for tool in/.test(line)) continue;
        // Only args after the jq token (ignore curl URL on the left of a pipe).
        const afterJq = line.slice(jqIdx);
        const cmd = afterJq.split(/\s*(?:\|\||&&|[>|])/ )[0];
        let m;
        pathArg.lastIndex = 0;
        while ((m = pathArg.exec(cmd)) !== null) {
          const arg = m[1];
          if (!allowed(arg)) bad.push(`${name}: ${arg} in: ${trimmed}`);
        }
      }
    }
    assert.deepEqual(bad, [], bad.join('\n'));
  });

  test('step.sh copies academy.project.json into OPENSHIP_TMP before jq -s readiness merge', () => {
    const step = scripts.find((s) => s.name === 'step.sh').text;
    const copyAt = step.indexOf('cp "$KIT_DIR/academy.project.json" "$OPENSHIP_TMP/academy.project.json"');
    const mergeAt = step.indexOf(
      `jq -s '.[0] + {readiness: .[1].readiness}' "$OPENSHIP_TMP/endpoints.json" "$OPENSHIP_TMP/academy.project.json"`,
    );
    assert.ok(copyAt !== -1, 'copies academy.project.json into OPENSHIP_TMP');
    assert.ok(mergeAt !== -1, 'jq -s uses OPENSHIP_TMP paths only');
    assert.ok(copyAt < mergeAt, 'copy happens before jq -s');
  });
});

describe('OpenShip app env: omit DATABASE_URL (no compose shadow)', () => {
  const kit = new URL('../infra/openship/', import.meta.url);
  const compose = readFileSync(new URL('academy.compose.yaml', kit), 'utf8');
  const {services} = JSON.parse(readFileSync(new URL('academy.services.json', kit), 'utf8'));
  const step = readFileSync(path.join(root, 'infra/openship/step.sh'), 'utf8');
  const lib = readFileSync(path.join(root, 'infra/openship/lib.sh'), 'utf8');
  const research = readFileSync(path.join(root, 'infra/openship/RESEARCH.md'), 'utf8');
  const runbook = readFileSync(path.join(root, 'docs/runbooks/single-academy-openship.md'), 'utf8');
  const app = services.find((service) => service.name === 'app');

  test('app environment omits DATABASE_URL, REDIS_URL, and SOURCE_REVISION', () => {
    assert.equal(Object.hasOwn(app.environment, 'DATABASE_URL'), false);
    assert.equal(Object.hasOwn(app.environment, 'REDIS_URL'), false);
    assert.equal(Object.hasOwn(app.environment, 'SOURCE_REVISION'), false);
    // Executable app env lines only (comments may mention the pitfall).
    const appBlock = compose.split(/\n {2}[a-z]/)[1] || '';
    const envKeyLines = appBlock.split('\n').filter((line) => /^\s+[A-Z_]+:\s+/.test(line));
    for (const line of envKeyLines) {
      assert.doesNotMatch(line, /^\s+(DATABASE_URL|REDIS_URL|SOURCE_REVISION):/, line);
    }
    // Keep other non-secret app env.
    for (const key of ['ACADEMY_STORAGE', 'HOST', 'PORT', 'PROOF_PORT', 'ACADEMY_DATA', 'NODE_EXTRA_CA_CERTS']) {
      assert.ok(Object.hasOwn(app.environment, key), key);
    }
  });

  test('kit compose must not contain the string ${DATABASE_URL} anywhere', () => {
    assert.equal(compose.includes('${DATABASE_URL}'), false);
    assert.doesNotMatch(compose, /\$\{DATABASE_URL\}/);
    assert.doesNotMatch(compose, /\$\{REDIS_URL\}/);
    assert.doesNotMatch(compose, /\$\{SOURCE_REVISION\}/);
    assert.doesNotMatch(JSON.stringify(services), /\$\{DATABASE_URL\}/);
    assert.doesNotMatch(JSON.stringify(services), /\$\{REDIS_URL\}/);
    assert.doesNotMatch(JSON.stringify(services), /\$\{SOURCE_REVISION\}/);
  });

  test('no bash :- or :? in remaining app interpolateable env fields', () => {
    for (const [key, value] of Object.entries(app.environment)) {
      if (!String(value).includes('${')) continue;
      assert.doesNotMatch(String(value), /:-|:\?/, `${key}=${value}`);
    }
    const appBlock = compose.split(/\n {2}[a-z]/)[1] || '';
    const envLines = appBlock.split('\n').filter((line) => /^\s+[A-Z_]+:\s+.*\$\{/.test(line));
    for (const line of envLines) {
      assert.doesNotMatch(line, /:-|:\?/, line);
    }
  });

  test('postgres/redis same-key ${POSTGRES_PASSWORD}/${REDIS_PASSWORD} without :? / :-', () => {
    const postgres = services.find((service) => service.name === 'postgres');
    const redis = services.find((service) => service.name === 'redis');
    assert.equal(postgres.environment.POSTGRES_PASSWORD, '${POSTGRES_PASSWORD}');
    assert.equal(redis.environment.REDISCLI_AUTH, '${REDIS_PASSWORD}');
    assert.ok(redis.commandArgv.includes('${REDIS_PASSWORD}'));
    assert.ok(redis.commandArgv.every((arg) => !/:\?|:-/.test(arg)));
    assert.match(compose, /POSTGRES_PASSWORD:\s+\$\{POSTGRES_PASSWORD\}$/m);
    assert.match(compose, /REDISCLI_AUTH:\s+\$\{REDIS_PASSWORD\}$/m);
    assert.doesNotMatch(compose, /POSTGRES_PASSWORD:\s+\$\{POSTGRES_PASSWORD:[?-]/);
    assert.doesNotMatch(compose, /REDIS_PASSWORD:[?-]/);
  });

  test('step.sh upserts resolved DATABASE_URL and REDIS_URL (and SOURCE_REVISION)', () => {
    assert.match(step, /printf 'DATABASE_URL=postgresql:\/\/academy:%s@postgres:5432\/academy\\n'/);
    assert.match(step, /printf 'REDIS_URL=rediss:\/\/%s@redis:6379\\n'|printf 'REDIS_URL=rediss:\/\/:%s@redis:6379\\n'/);
    assert.match(step, /SOURCE_REVISION=%s/);
    assert.match(step, /omit|shadow|ERR_INVALID_URL/);
    // Keys must be isSecret (not in the non-secret allowlist)
    assert.match(step, /IN\("ACADEMY_PORT_BIND", "SOURCE_REVISION"\)/);
    assert.doesNotMatch(step, /IN\([^)]*DATABASE_URL/);
    assert.doesNotMatch(step, /IN\([^)]*REDIS_URL/);
  });

  test('COMPOSE_OWNED_ENV includes DATABASE_URL and REDIS_URL (kit-owned, not from legacy .env)', () => {
    assert.match(lib, /COMPOSE_OWNED_ENV='[^']*DATABASE_URL[^']*REDIS_URL/);
    assert.match(lib, /fully resolved secrets upserted by step\.sh|upserted by step\.sh deploy/);
  });

  test('RESEARCH and runbook document no compose interpolation / project-env shadow', () => {
    assert.match(research, /does \*\*not\*\*[\s\S]{0,80}interpolate|does not interpolate/i);
    assert.match(research, /shadow/i);
    assert.match(research, /ERR_INVALID_URL/);
    assert.match(research, /omit/i);
    assert.match(runbook, /omit/i);
    assert.match(runbook, /shadow/i);
    assert.match(runbook, /ERR_INVALID_URL|DATABASE_URL.*REDIS_URL/);
  });
});

describe('compose build context and service drift', () => {
  const research = readFileSync(path.join(root, 'infra/openship/RESEARCH.md'), 'utf8');
  const runbook = readFileSync(path.join(root, 'docs/runbooks/single-academy-openship.md'), 'utf8');

  test('RESEARCH.md documents repo-root build context .', () => {
    assert.match(research, /context: \./);
    assert.match(research, /path escapes the linked repository|escapes the repository/);
    assert.doesNotMatch(research, /Unverified:.*context: \.\.\/\.\./);
  });

  test('docs note openship services drift accept|keep when sync unavailable', () => {
    assert.match(research, /openship services drift (accept|keep)/);
    assert.match(runbook, /openship services drift (accept|keep)/);
  });
});


describe('deploy reuses Postgres/Redis passwords (no remint against pgdata)', () => {
  const lib = readFileSync(path.join(root, 'infra/openship/lib.sh'), 'utf8');
  const step = readFileSync(path.join(root, 'infra/openship/step.sh'), 'utf8');
  const research = readFileSync(path.join(root, 'infra/openship/RESEARCH.md'), 'utf8');
  const runbook = readFileSync(path.join(root, 'docs/runbooks/single-academy-openship.md'), 'utf8');
  const token = 'opsh_pat_synthetic0123456789';

  test('step.sh calls ensure_db_passwords after ensure_project_id (before openssl mint path)', () => {
    assert.match(step, /ensure_db_passwords/);
    const ensureProjectAt = step.indexOf('id="$(ensure_project_id)"');
    const ensurePwAt = step.indexOf('ensure_db_passwords "$id"');
    assert.ok(ensureProjectAt !== -1 && ensurePwAt !== -1);
    assert.ok(ensureProjectAt < ensurePwAt, 'project id before password resolve');
    // No bare openssl-rand mint in step.sh deploy — mint lives in ensure_db_passwords.
    assert.doesNotMatch(step, /openssl rand -hex 24/);
  });

  test('lib.sh ensure_db_passwords reuses secrets.env, recovers from containers, refuses remint', () => {
    assert.match(lib, /ensure_db_passwords/);
    assert.match(lib, /Reusing Postgres\/Redis passwords from/);
    assert.match(lib, /Recovered passwords from running postgres\/redis containers/);
    assert.match(lib, /OPENSHIP_ROTATE_PASSWORDS/);
    assert.match(lib, /already has POSTGRES_PASSWORD/);
    assert.match(lib, /Never PATCH service environment from a masked GET/);
    assert.match(lib, /pgdata_volume_exists|openship-%s-pgdata/);
    assert.match(lib, /openssl rand -hex 24/);
  });

  test('RESEARCH and runbook document reuse, reject, and masked GET', () => {
    assert.match(research, /28P01/);
    assert.match(research, /ensure_db_passwords/);
    assert.match(research, /OPENSHIP_ROTATE_PASSWORDS/);
    assert.match(research, /rejectDeployment|deployment reject/i);
    assert.match(research, /masked GET|never PATCH service/i);
    assert.match(runbook, /OPENSHIP_ROTATE_PASSWORDS/);
    assert.match(runbook, /deployment reject|masked/i);
  });

  test('app compose/services still omit DATABASE_URL, REDIS_URL, SOURCE_REVISION', () => {
    const kit = new URL('../infra/openship/', import.meta.url);
    const compose = readFileSync(new URL('academy.compose.yaml', kit), 'utf8');
    const {services} = JSON.parse(readFileSync(new URL('academy.services.json', kit), 'utf8'));
    const app = services.find((service) => service.name === 'app');
    assert.equal(Object.hasOwn(app.environment, 'DATABASE_URL'), false);
    assert.equal(Object.hasOwn(app.environment, 'REDIS_URL'), false);
    assert.equal(Object.hasOwn(app.environment, 'SOURCE_REVISION'), false);
    assert.equal(compose.includes('${DATABASE_URL}'), false);
  });

  const runEnsurePw = ({secretsContent = null, envJson, dockerInspect = {}, rotate = false, volumeExists = false}) => {
    const bin = mkdtempSync(path.join(scratch, 'curl-pw-'));
    const kitHome = mkdtempSync(path.join(scratch, 'kit-pw-'));
    if (secretsContent !== null) {
      writeFileSync(path.join(kitHome, 'secrets.env'), secretsContent);
    }
    const inspectLog = path.join(bin, 'inspect.log');
    writeFileSync(inspectLog, '');
    const pgEnv = dockerInspect.postgres || '';
    const redisEnv = dockerInspect.redis || '';
    writeFileSync(path.join(bin, 'docker'), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "${inspectLog}"
if [[ "$1" == volume && "$2" == inspect ]]; then
  ${volumeExists ? 'exit 0' : 'exit 1'}
fi
if [[ "$*" == *"--type"*"container"* ]]; then
  # existence check (no format) or env format
  name="\${@: -1}"
  case "$name" in
    openship-academy-postgres|openship-academy-redis) ;;
    *) exit 1 ;;
  esac
  if [[ "$*" == *Config.Env* ]]; then
    case "$name" in
      openship-academy-postgres)
        cat <<'DOCKEREOF'
${pgEnv}
DOCKEREOF
        ;;
      openship-academy-redis)
        cat <<'DOCKEREOF'
${redisEnv}
DOCKEREOF
        ;;
    esac
  fi
  exit 0
fi
exit 0
`);
    chmodSync(path.join(bin, 'docker'), 0o755);
    const envBodyPath = path.join(bin, 'env.json');
    writeFileSync(envBodyPath, JSON.stringify(envJson));
    writeFileSync(path.join(bin, 'curl'), `#!/usr/bin/env bash
set -e
out=""; code_mode=0; args=("$@")
for i in "\${!args[@]}"; do
  [[ "\${args[\$i]}" == "-w" ]] && code_mode=1
  [[ "\${args[\$i]}" == "-o" ]] && out="\${args[\$((i+1))]}"
done
if [[ "$*" == *"/api/projects/"*"/env"* ]]; then
  body="$(cat "${envBodyPath}")"
  [[ -n "$out" ]] && printf '%s' "$body" > "$out" || printf '%s' "$body"
  [[ "$code_mode" == 1 ]] && printf 200
  exit 0
fi
echo "unexpected curl: $*" >&2
exit 99
`);
    chmodSync(path.join(bin, 'curl'), 0o755);
    const env = {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      OPENSHIP_TOKEN: token,
      KIT_HOME: kitHome,
    };
    if (rotate) env.OPENSHIP_ROTATE_PASSWORDS = '1';
    else delete env.OPENSHIP_ROTATE_PASSWORDS;
    const result = spawnSync(
      'bash',
      ['-c', `source "${root}/infra/openship/lib.sh"; openship_session; ensure_db_passwords proj_PTFOnZxLMEKU4ys9; echo DONE_KEYS; test -f "$KIT_HOME/secrets.env" && cut -d= -f1 "$KIT_HOME/secrets.env"`],
      {encoding: 'utf8', env},
    );
    const secretsPath = path.join(kitHome, 'secrets.env');
    const secrets = existsSync(secretsPath) ? readFileSync(secretsPath, 'utf8') : '';
    return {result, secrets, kitHome};
  };

  test('reuses existing secrets.env without minting', () => {
    const {result, secrets} = runEnsurePw({
      secretsContent: 'POSTGRES_PASSWORD=existingpgpassword012345\nREDIS_PASSWORD=existingredispassword01234\n',
      envJson: {data: []},
    });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.stderr + result.stdout, /Reusing Postgres\/Redis passwords/);
    assert.match(secrets, /^POSTGRES_PASSWORD=existingpgpassword012345$/m);
    assert.match(secrets, /^REDIS_PASSWORD=existingredispassword01234$/m);
    assert.doesNotMatch(result.stderr + result.stdout, /Generating Postgres/);
  });

  test('when project has password keys and containers yield plaintext, recovers into secrets.env', () => {
    const {result, secrets} = runEnsurePw({
      secretsContent: null,
      envJson: {
        data: [
          {key: 'POSTGRES_PASSWORD', value: '••••••••', isSecret: true},
          {key: 'REDIS_PASSWORD', value: '••••••••', isSecret: true},
          {key: 'DATABASE_URL', value: '••••••••', isSecret: true},
        ],
      },
      dockerInspect: {
        postgres: 'POSTGRES_USER=academy\nPOSTGRES_PASSWORD=fromcontainergpass01234567\nPOSTGRES_DB=academy',
        redis: 'REDISCLI_AUTH=fromcontainerredispass0123456',
      },
    });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.stderr + result.stdout, /Recovered passwords from running/);
    assert.match(secrets, /^POSTGRES_PASSWORD=fromcontainergpass01234567$/m);
    assert.match(secrets, /^REDIS_PASSWORD=fromcontainerredispass0123456$/m);
    assert.doesNotMatch(result.stderr + result.stdout, /Generating Postgres/);
    // Never print password values in output
    assert.doesNotMatch(result.stderr + result.stdout, /fromcontainergpass/);
    assert.doesNotMatch(result.stderr + result.stdout, /fromcontainerredis/);
  });

  test('refuses remint when project has password keys, no secrets.env, containers empty', () => {
    const {result, secrets} = runEnsurePw({
      secretsContent: null,
      envJson: {
        data: [
          {key: 'POSTGRES_PASSWORD', value: '••••••••', isSecret: true},
          {key: 'REDIS_PASSWORD', value: '••••••••', isSecret: true},
        ],
      },
      dockerInspect: {},
    });
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /already has POSTGRES_PASSWORD/);
    assert.match(result.stderr, /OPENSHIP_ROTATE_PASSWORDS=1/);
    assert.match(result.stderr, /masked GET/);
    assert.equal(secrets, '');
  });

  test('refuses remint when pgdata volume exists and project env has no password keys', () => {
    const {result} = runEnsurePw({
      secretsContent: null,
      envJson: {data: [{key: 'SOURCE_REVISION', value: 'abc', isSecret: false}]},
      volumeExists: true,
    });
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /openship-academy-pgdata/);
    assert.match(result.stderr, /Refusing to openssl-rand/);
  });

  test('mints when no secrets, no project password keys, no volume', () => {
    const {result, secrets} = runEnsurePw({
      secretsContent: null,
      envJson: {data: []},
      volumeExists: false,
    });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.stderr + result.stdout, /Generating Postgres and Redis passwords/);
    assert.match(secrets, /^POSTGRES_PASSWORD=[a-f0-9]{48}$/m);
    assert.match(secrets, /^REDIS_PASSWORD=[a-f0-9]{48}$/m);
  });
});
