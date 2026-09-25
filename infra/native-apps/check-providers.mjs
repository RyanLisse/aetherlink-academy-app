import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const governanceFields = ['accountOwner', 'retention', 'backup', 'budget'];
const envLine = /^([A-Z][A-Z0-9_]*)=(.*)$/;

function envExampleProblems(app, text) {
  const problems = [];
  const names = new Set();
  for (const [index, raw] of text.split('\n').entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = envLine.exec(line);
    if (!match) {
      problems.push(`${app}: env example line ${index + 1} is not NAME=`);
      continue;
    }
    names.add(match[1]);
    if (match[2] !== '') problems.push(`${app}: env example ${match[1]} must have an empty value`);
  }
  return {problems, names};
}

export function providerContractProblems({manifest, providersDoc, readEnvExample}) {
  const problems = [];
  for (const entry of manifest.apps) {
    const {app, providers} = entry;
    if (!providers) {
      problems.push(`${app}: manifest has no providers block`);
      continue;
    }
    if (!providersDoc.includes(`## ${app}`)) problems.push(`${app}: PROVIDERS.md has no "## ${app}" section`);
    const envText = readEnvExample(providers.envExample);
    if (envText === undefined) {
      problems.push(`${app}: env example ${providers.envExample} is missing`);
      continue;
    }
    const env = envExampleProblems(app, envText);
    problems.push(...env.problems);
    for (const name of providers.requiredEnv) {
      if (!env.names.has(name)) problems.push(`${app}: ${name} missing from ${providers.envExample}`);
      if (!providersDoc.includes(`\`${name}\``)) problems.push(`${app}: ${name} missing from PROVIDERS.md`);
    }
    for (const prefix of providers.requiredEnvPrefixes ?? []) {
      if (!envText.includes(prefix)) problems.push(`${app}: ${prefix}* missing from ${providers.envExample}`);
      if (!providersDoc.includes(`\`${prefix}*\``)) problems.push(`${app}: ${prefix}* missing from PROVIDERS.md`);
    }
    for (const connection of providers.connections) {
      for (const field of governanceFields) {
        if (typeof connection[field] !== 'string' || !connection[field].trim()) problems.push(`${app}: ${connection.capability} has no ${field}`);
      }
    }
    const covered = new Set(providers.connections.map((connection) => connection.capability));
    if (providers.backgroundWorker) covered.add('media-capacity');
    for (const requirement of entry.releaseRequirements) {
      if (!covered.has(requirement)) problems.push(`${app}: release requirement ${requirement} has no provider contract`);
    }
    if (providers.backgroundWorker && providers.backgroundWorker.enabled !== false) {
      problems.push(`${app}: background worker must stay disabled until its prerequisites are proven`);
    }
  }
  return problems;
}

export function checkRepository(root) {
  const dir = path.join(root, 'infra/native-apps');
  const manifest = JSON.parse(readFileSync(path.join(dir, 'apps.manifest.json'), 'utf8'));
  const providersDoc = readFileSync(path.join(dir, 'PROVIDERS.md'), 'utf8');
  const readEnvExample = (relative) => {
    try {
      return readFileSync(path.join(root, relative), 'utf8');
    } catch {
      return undefined;
    }
  };
  return providerContractProblems({manifest, providersDoc, readEnvExample});
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkRepository(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));
  for (const problem of problems) console.error(problem);
  if (problems.length) process.exit(1);
  console.log('native-apps provider contract ok');
}
