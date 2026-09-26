#!/usr/bin/env node
// Read-only: checks /game/config and, when ACADEMY_SMTP_HOST is set locally, runs an SMTP
// handshake (greeting, EHLO, TLS, AUTH, NOOP, QUIT). It never sends MAIL FROM, RCPT or DATA.
import net from 'node:net';
import tls from 'node:tls';
import {baseOrigin, check, describeError, fetchJson, isMain, parseArgs, report} from './lib.mjs';

const USAGE = 'usage: [ACADEMY_SMTP_*=...] node scripts/verify/smtp.mjs [gateway-base-url]';
const EHLO_NAME = 'academy-verify';

/** Same acceptance rule as createMailTransport in server/email-login.mjs. */
export function smtpSettings(env) {
  const transport = String(env.ACADEMY_MAIL_TRANSPORT || '').trim().toLowerCase();
  const host = String(env.ACADEMY_SMTP_HOST || '').trim();
  const port = Number(env.ACADEMY_SMTP_PORT || 587);
  const from = String(env.ACADEMY_SMTP_FROM || '').trim();
  const user = env.ACADEMY_SMTP_USER || '';
  const pass = env.ACADEMY_SMTP_PASS || '';
  const problems = [];
  if (transport !== 'smtp') problems.push(`ACADEMY_MAIL_TRANSPORT is ${JSON.stringify(transport)}, expected "smtp"`);
  if (!host) problems.push('ACADEMY_SMTP_HOST is empty');
  if (!Number.isInteger(port)) problems.push('ACADEMY_SMTP_PORT is not an integer');
  if (!from) problems.push('ACADEMY_SMTP_FROM is empty');
  if (Boolean(user) !== Boolean(pass)) problems.push('set both or neither of ACADEMY_SMTP_USER and ACADEMY_SMTP_PASS');
  return {host, port, from, user, pass, requireTls: port !== 465 && env.ACADEMY_SMTP_REQUIRE_TLS !== '0', problems};
}

class SmtpSession {
  constructor(socket, timeoutMs) {
    this.timeoutMs = timeoutMs;
    this.sent = [];
    this.replies = [];
    this.lines = [];
    this.buffer = '';
    this.waiter = null;
    this.error = null;
    this.onData = (chunk) => this.receive(chunk);
    this.onError = (error) => this.fail(error);
    this.onClose = () => this.fail(new Error('connection closed by server'));
    this.attach(socket);
  }

  attach(socket) {
    this.socket = socket;
    socket.on('data', this.onData).on('error', this.onError).on('close', this.onClose);
  }

  detach() {
    this.socket.off('data', this.onData).off('error', this.onError).off('close', this.onClose);
    return this.socket;
  }

  receive(chunk) {
    this.buffer += chunk.toString('utf8');
    let end;
    while ((end = this.buffer.indexOf('\r\n')) >= 0) {
      const line = this.buffer.slice(0, end);
      this.buffer = this.buffer.slice(end + 2);
      this.lines.push(line);
      if (/^\d{3}(?: |$)/.test(line)) {
        this.replies.push({code: Number(line.slice(0, 3)), lines: this.lines});
        this.lines = [];
      }
    }
    this.settle();
  }

  fail(error) {
    this.error ??= error;
    this.settle();
  }

  settle() {
    if (!this.waiter) return;
    const {resolve, reject, timer} = this.waiter;
    if (this.replies.length) resolve(this.replies.shift());
    else if (this.error) reject(this.error);
    else return;
    clearTimeout(timer);
    this.waiter = null;
  }

  read() {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiter = null;
        reject(new Error(`no SMTP reply within ${this.timeoutMs} ms`));
      }, this.timeoutMs);
      this.waiter = {resolve, reject, timer};
      this.settle();
    });
  }

  send(line, shown = line) {
    this.sent.push(shown);
    this.socket.write(`${line}\r\n`);
    return this.read();
  }
}

const connected = (socket, event, timeoutMs) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`connect timed out after ${timeoutMs} ms`));
    }, timeoutMs);
    socket.once(event, () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });

const advertised = (reply, keyword) => reply.lines.find((line) => new RegExp(`^250[- ]${keyword}\\b`, 'i').test(line));

/** Returns the checks plus the exact commands sent (AUTH shown redacted), for tests and the runbook. */
export async function smtpHandshake({host, port, user, pass, requireTls, timeoutMs = 10_000, tlsOptions = {}}) {
  const checks = [];
  const implicitTls = port === 465;
  let session;
  try {
    const socket = implicitTls
      ? await connected(tls.connect({host, port, servername: host, ...tlsOptions}), 'secureConnect', timeoutMs)
      : await connected(net.connect({host, port}), 'connect', timeoutMs);
    session = new SmtpSession(socket, timeoutMs);
    const greeting = await session.read();
    checks.push(check('SMTP greeting', greeting.code === 220, `${host}:${port} answered ${greeting.code}`));
    if (greeting.code !== 220) return {checks, sent: session.sent};
    let ehlo = await session.send(`EHLO ${EHLO_NAME}`);
    checks.push(check('EHLO', ehlo.code === 250, `code ${ehlo.code}`));
    let tlsActive = implicitTls;
    if (implicitTls) checks.push(check('TLS', true, `implicit TLS on 465, ${socket.getProtocol()}, certificate valid`));
    else if (advertised(ehlo, 'STARTTLS')) {
      const ready = await session.send('STARTTLS');
      if (ready.code !== 220) {
        checks.push(check('TLS', false, `STARTTLS answered ${ready.code}`));
        return {checks, sent: session.sent};
      }
      const secured = await connected(tls.connect({socket: session.detach(), servername: host, ...tlsOptions}), 'secureConnect', timeoutMs);
      session.attach(secured);
      tlsActive = true;
      checks.push(check('TLS', true, `STARTTLS, ${secured.getProtocol()}, certificate valid`));
      ehlo = await session.send(`EHLO ${EHLO_NAME}`);
    } else {
      checks.push(check('TLS', !requireTls, requireTls ? 'server does not offer STARTTLS; the app will refuse to send' : 'no TLS (ACADEMY_SMTP_REQUIRE_TLS=0, local test server only)'));
      if (requireTls) {
        await session.send('QUIT').catch(() => {});
        return {checks, sent: session.sent};
      }
    }
    if (user) {
      const mechanisms = (advertised(ehlo, 'AUTH') ?? '').toUpperCase();
      let result;
      if (mechanisms.includes('PLAIN') || !mechanisms.includes('LOGIN')) {
        result = await session.send(`AUTH PLAIN ${Buffer.from(`\0${user}\0${pass}`).toString('base64')}`, 'AUTH PLAIN [redacted]');
      } else {
        await session.send('AUTH LOGIN');
        await session.send(Buffer.from(user).toString('base64'), '[redacted user]');
        result = await session.send(Buffer.from(pass).toString('base64'), '[redacted password]');
      }
      checks.push(check('AUTH', result.code === 235, `code ${result.code}${result.code === 235 ? '' : ', check ACADEMY_SMTP_USER / ACADEMY_SMTP_PASS'}${tlsActive ? '' : ', sent without TLS'}`));
    }
    const noop = await session.send('NOOP');
    checks.push(check('NOOP', noop.code === 250, `code ${noop.code}`));
    await session.send('QUIT').catch(() => {});
  } catch (error) {
    checks.push(check('SMTP handshake', false, `${host}:${port} ${describeError(error)}`));
  } finally {
    session?.socket.destroy();
  }
  return {checks, sent: session?.sent ?? []};
}

export async function verifySmtp(base, env) {
  const checks = [];
  if (base) {
    try {
      const config = await fetchJson(`${base}/game/config`);
      checks.push(check('/game/config emailLogin', config.json?.emailLogin === true, `emailLogin=${JSON.stringify(config.json?.emailLogin)} (HTTP ${config.status})`));
    } catch (error) {
      checks.push(check('/game/config emailLogin', false, describeError(error)));
    }
  }
  if (env.ACADEMY_SMTP_HOST) {
    const settings = smtpSettings(env);
    checks.push(check('SMTP env complete', settings.problems.length === 0, settings.problems.join('; ') || `host ${settings.host}, port ${settings.port}, from ${settings.from}, auth ${settings.user ? 'yes' : 'no'}`));
    if (settings.problems.length === 0) checks.push(...(await smtpHandshake(settings)).checks);
  }
  return checks;
}

if (isMain(import.meta)) {
  const {positional} = parseArgs(process.argv.slice(2));
  if (!positional[0] && !process.env.ACADEMY_SMTP_HOST) {
    console.error(USAGE);
    process.exit(2);
  }
  const base = positional[0] ? baseOrigin(positional[0]) : null;
  process.exitCode = report(`Email login${base ? ` on ${base}` : ''}${process.env.ACADEMY_SMTP_HOST ? ' + SMTP handshake' : ''}`, await verifySmtp(base, process.env));
}
