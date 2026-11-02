#!/usr/bin/env node
/**
 * Securely configures the live Claude assistant.
 *
 * The key is read without echo, written only to the root `.env` (gitignored),
 * and never printed. It is intentionally not an EXPO_PUBLIC_ value: those are
 * compiled into the app bundle, where anyone could read and spend the key.
 *
 * Usage:
 *   npm run ai:configure            prompt for a key (hidden input)
 *   npm run ai:configure -- --replace   overwrite an existing key
 *   npm run ai:status               show configuration + server status
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Writable } = require('stream');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const STATUS_URL = process.env.AI_STATUS_URL || 'http://localhost:3001/api/ai/status';
const KEY_NAME = 'ANTHROPIC_API_KEY';

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check') || args.has('--status');
const replace = args.has('--replace');

function readEnv() {
  try {
    return fs.readFileSync(ENV_PATH, 'utf8');
  } catch {
    return '';
  }
}

function activeKey(text) {
  // [ \t] rather than \s: \s would swallow the newline after an empty
  // `ANTHROPIC_API_KEY=` and capture the next line as the value.
  const match = text.match(new RegExp(`^[ \\t]*${KEY_NAME}[ \\t]*=[ \\t]*(.*)$`, 'm'));
  if (!match) return '';
  return match[1].trim().replace(/^["']|["']$/g, '');
}

function describe(key) {
  if (!key) return 'not configured';
  const formatOk = key.startsWith('sk-ant-');
  return `${formatOk ? 'looks valid' : 'unexpected format'} (…${key.slice(-4)})`;
}

async function serverStatus() {
  try {
    const response = await fetch(STATUS_URL, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return `HTTP ${response.status}`;
    const data = await response.json();
    return data.configured
      ? `live assistant ON (model: ${data.model || 'default'})`
      : 'live assistant OFF (server started without a key)';
  } catch {
    return 'server not reachable';
  }
}

function promptHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error('This prompt needs an interactive terminal.'));
      return;
    }

    // readline normally echoes every keystroke. Routing its output to a sink
    // suppresses the key while keeping paste, backspace and Ctrl+C working.
    const muted = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
    const rl = readline.createInterface({ input: process.stdin, output: muted, terminal: true });

    process.stdout.write(question);
    rl.question('', answer => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer.trim());
    });
    rl.on('SIGINT', () => {
      rl.close();
      process.stdout.write('\n');
      reject(new Error('Cancelled.'));
    });
  });
}

function writeKey(key) {
  const original = readEnv();
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  const lines = original ? original.split(/\r?\n/) : [];
  let replaced = false;

  const updated = lines.map(line => {
    if (new RegExp(`^[ \\t]*${KEY_NAME}[ \\t]*=`).test(line)) {
      replaced = true;
      return `${KEY_NAME}=${key}`;
    }
    return line;
  });

  if (!replaced) {
    if (updated.length && updated[updated.length - 1].trim() !== '') updated.push('');
    updated.push('# Server-side Anthropic key for the live assistant. Never expose this as EXPO_PUBLIC_*.');
    updated.push(`${KEY_NAME}=${key}`);
  }

  const body = updated.join(newline).replace(new RegExp(`${newline}+$`), '') + newline;
  fs.writeFileSync(ENV_PATH, body, { encoding: 'utf8', mode: 0o600 });
  try {
    fs.chmodSync(ENV_PATH, 0o600);
  } catch {
    // Windows does not map POSIX modes; the file is still local and ignored by git.
  }
}

function printNextSteps() {
  console.log('');
  console.log('Next steps:');
  console.log('  1. Restart the API so it reads the new value:');
  console.log('       npm run server        (or stop/start npm run dev)');
  console.log('  2. Verify from another terminal:');
  console.log('       npm run ai:status');
  console.log('  3. Open the app -> AI Assistant. The header should switch from');
  console.log('     "Offline mode" to the live Claude badge.');
  console.log('');
  console.log('Do not use start.bat — it force-kills every node.exe on this machine.');
}

(async () => {
  const existing = activeKey(readEnv());
  console.log('Qitab-e-Noor — live AI configuration');
  console.log(`File:  ${ENV_PATH}`);
  console.log(`Key:   ${describe(existing)}`);
  console.log(`Server: ${await serverStatus()}`);
  console.log('');

  if (checkOnly) {
    if (!existing) {
      console.log('Add a key with:  npm run ai:configure');
      process.exitCode = 1;
    }
    return;
  }

  if (existing && !replace) {
    console.log('A key is already configured. Re-run with --replace to change it.');
    return;
  }

  console.log('Paste your Anthropic API key (input is hidden).');
  console.log('Create one at https://console.anthropic.com/ — it starts with sk-ant-');
  const key = await promptHidden('API key: ');

  if (!key) {
    console.error('No key entered; nothing was changed.');
    process.exitCode = 1;
    return;
  }
  if (!key.startsWith('sk-ant-')) {
    console.error('That does not look like an Anthropic key (expected sk-ant-...). Nothing was changed.');
    process.exitCode = 1;
    return;
  }
  if (key.length < 40 || /\s/.test(key)) {
    console.error('The key looks truncated or contains whitespace. Nothing was changed.');
    process.exitCode = 1;
    return;
  }

  writeKey(key);
  console.log('');
  console.log(`Saved ${KEY_NAME} to .env (hidden, gitignored). ${describe(key)}.`);
  printNextSteps();
})().catch(error => {
  console.error(error.message || String(error));
  process.exitCode = 1;
});
