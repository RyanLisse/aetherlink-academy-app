#!/usr/bin/env node
// Read-only: never follows the redirect to Google and never completes a login.
import {baseOrigin, check, describeError, fetchJson, googleStartChecks, isMain, parseArgs, report} from './lib.mjs';

const USAGE = 'usage: node scripts/verify/google-oauth.mjs <gateway-base-url> [--public-url <ACADEMY_PUBLIC_URL>]';

export async function verifyGoogleOauth(base, {publicUrl} = {}) {
  const checks = [];
  try {
    const config = await fetchJson(`${base}/game/config`);
    checks.push(check('/game/config googleSso', config.json?.googleSso === true, `googleSso=${JSON.stringify(config.json?.googleSso)} (HTTP ${config.status})`));
  } catch (error) {
    checks.push(check('/game/config googleSso', false, describeError(error)));
  }
  checks.push(...(await googleStartChecks(base, publicUrl)));
  return checks;
}

if (isMain(import.meta)) {
  const {positional, flags} = parseArgs(process.argv.slice(2));
  if (!positional[0]) {
    console.error(USAGE);
    process.exit(2);
  }
  const base = baseOrigin(positional[0]);
  process.exitCode = report(`Google OAuth on ${base}`, await verifyGoogleOauth(base, {publicUrl: flags['public-url']}));
}
