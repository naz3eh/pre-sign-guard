// evals/run.ts — executes evals/cases.json against the guard and prints a table.
// Exits non-zero if any case's verdict/kind/exit_code/summary_contains mismatches.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { check } from '../src/guard.js';
import type { SignRequest } from '../src/types.js';

interface Case {
  id: string;
  description: string;
  request: SignRequest;
  expect: {
    verdict: string;
    kind?: string;
    exit_code?: number;
    summary_contains?: string[];
  };
}

const EXIT: Record<string, number> = { ALLOW_WITH_CONFIRMATION: 0, BLOCK: 2, REFUSE: 3 };

const cases = JSON.parse(
  readFileSync(fileURLToPath(new URL('./cases.json', import.meta.url)), 'utf8'),
).cases as Case[];

let failures = 0;
for (const c of cases) {
  const res = check(c.request);
  const problems: string[] = [];
  if (res.verdict !== c.expect.verdict) problems.push(`verdict ${res.verdict} ≠ ${c.expect.verdict}`);
  if (c.expect.kind && res.kind !== c.expect.kind) problems.push(`kind ${res.kind} ≠ ${c.expect.kind}`);
  const exit = EXIT[res.verdict];
  if (c.expect.exit_code !== undefined && exit !== c.expect.exit_code) problems.push(`exit ${exit} ≠ ${c.expect.exit_code}`);
  const summary = [res.title, res.reason, ...res.warnings, ...res.fields.map((f) => `${f.label} ${f.value}`)].join('\n');
  for (const needle of c.expect.summary_contains ?? []) {
    if (!summary.toLowerCase().includes(needle.toLowerCase())) problems.push(`summary missing "${needle}"`);
  }
  if (problems.length) {
    failures++;
    console.log(`✗ ${c.id}  ${problems.join('; ')}`);
  } else {
    console.log(`✓ ${c.id}  → ${res.verdict}`);
  }
}
console.log(`\n${cases.length - failures}/${cases.length} cases passed`);
process.exit(failures ? 1 : 0);
