#!/usr/bin/env -S npx tsx
// guard check <payload> — decode an EVM signing request and print a verdict.
//
// payload is one of:
//   0x…                                        32-byte digest (REFUSE) or preimage hex
//   {"hash":"0x…","preimage":"0x…"}            digest + preimage (verified)
//   {"hash":"0x…","typedData":{…}}             EIP-712 typed data (recomputed)
//   @path                                      read payload from a file
//   -                                          read payload from stdin
//
// flags:
//   --json                     machine-readable output
//   --allow 0x<delegate>:<chainId>   allowlist a delegate+chain (repeatable)
//   --allowlist <file.json>    {"allow":[{"delegate":"0x…","chainId":1}]}
//
// exit codes: 0 ALLOW_WITH_CONFIRMATION · 2 BLOCK · 3 REFUSE · 64 usage error

import { readFileSync } from 'node:fs';
import { check } from './guard.js';
import type { AllowEntry, CheckResult, SignRequest } from './types.js';

const EXIT: Record<string, number> = { ALLOW_WITH_CONFIRMATION: 0, BLOCK: 2, REFUSE: 3 };

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  if (args[0] !== 'check') usage(`unknown command "${args[0] ?? ''}" — expected "check"`);
  const rest = args.slice(1);
  let payload: string | undefined;
  let json = false;
  const allowlist: AllowEntry[] = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]!;
    if (a === '--json') json = true;
    else if (a === '--allow') {
      const v = rest[++i];
      if (!v) usage('--allow requires 0x<delegate>:<chainId>');
      const m = /^(0x[0-9a-fA-F]{40}):(\d+)$/.exec(v);
      if (!m) usage(`--allow expects 0x<delegate>:<chainId>, got "${v}"`);
      allowlist.push({ delegate: m[1] as `0x${string}`, chainId: parseInt(m[2]!, 10) });
    } else if (a === '--allowlist') {
      const file = rest[++i];
      if (!file) usage('--allowlist requires a JSON file path');
      try {
        const parsed = JSON.parse(readFileSync(file, 'utf8')) as { allow: AllowEntry[] };
        allowlist.push(...parsed.allow);
      } catch (e) {
        usage(`could not read allowlist file: ${(e as Error).message}`);
      }
    } else if (a === '--help' || a === '-h') {
      usage(null);
    } else if (payload === undefined) {
      payload = a;
    } else {
      usage(`unexpected extra argument "${a}"`);
    }
  }
  if (payload === undefined) usage('missing payload');
  return { payload: payload!, json, allowlist };
}

function loadPayload(raw: string): SignRequest {
  let text = raw;
  if (raw === '-') {
    text = readFileSync(0, 'utf8').trim();
  } else if (raw.startsWith('@')) {
    text = readFileSync(raw.slice(1), 'utf8').trim();
  }
  if (text.startsWith('{')) {
    let obj: SignRequest;
    try {
      obj = JSON.parse(text) as SignRequest;
    } catch {
      usage('payload looks like JSON but does not parse');
    }
    return obj!;
  }
  if (!text.startsWith('0x')) {
    // not hex and not JSON → let the guard REFUSE it as an unusable payload
    return { hash: text as `0x${string}` };
  }
  if (/^0x[0-9a-fA-F]{64}$/.test(text)) return { hash: text as `0x${string}` };
  return { preimage: text as `0x${string}` };
}

function usage(msg: string | null): never {
  const lines = [
    'usage: guard check <payload> [--json] [--allow 0x<delegate>:<chainId>]… [--allowlist file.json]',
    '  payload: 0x… hex (32-byte digest → REFUSE; otherwise preimage), or',
    '           {"hash","preimage","typedData"} JSON, or @file, or - (stdin)',
  ];
  if (msg) lines.push(`error: ${msg}`);
  console.error(lines.join('\n'));
  process.exit(msg ? 64 : 0);
}

function color(enabled: boolean, code: string, s: string): string {
  return enabled ? `${code}${s}${RESET}` : s;
}

export function render(res: CheckResult, useColor: boolean): string {
  const c = (code: string, s: string) => color(useColor, code, s);
  const badge =
    res.verdict === 'ALLOW_WITH_CONFIRMATION'
      ? c(GREEN + BOLD, 'ALLOW_WITH_CONFIRMATION')
      : res.verdict === 'BLOCK'
        ? c(RED + BOLD, 'BLOCK')
        : c(YELLOW + BOLD, 'REFUSE');
  const lines: string[] = [];
  lines.push(c(CYAN + BOLD, '◆ PRE-SIGN GUARD'));
  lines.push(`${c(BOLD, 'VERDICT')}  ${badge}  ${c(DIM, `(${res.kind})`)}`);
  lines.push('');
  lines.push(res.title);
  if (res.hash) lines.push(`${c(DIM, 'digest')}  ${res.hash}`);
  if (res.fields.length) {
    lines.push('');
    const w = Math.max(...res.fields.map((f) => f.label.length));
    for (const f of res.fields) lines.push(`  ${f.label.padEnd(w)}  ${f.value}`);
  }
  if (res.warnings.length) {
    lines.push('');
    for (const w of res.warnings) lines.push(`${c(RED + BOLD, '⚠')}  ${c(RED, w)}`);
  }
  lines.push('');
  lines.push(`${c(BOLD, 'WHY')}  ${res.reason}`);
  return lines.join('\n');
}

function isMain(): boolean {
  const argv1 = process.argv[1];
  if (!argv1) return false;
  return import.meta.url === `file://${argv1}` || argv1.endsWith('/cli.ts') || argv1.endsWith('\\cli.ts');
}

if (isMain()) {
  const { payload, json, allowlist } = parseArgs(process.argv);
  const req = loadPayload(payload);
  const res = check(req, { allowlist });
  if (json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
    console.log(render(res, useColor));
  }
  process.exit(EXIT[res.verdict] ?? 3);
}
