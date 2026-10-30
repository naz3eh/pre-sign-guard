// Executes every case in evals/cases.json so `npm test` covers the eval suite.
import { describe, expect, it } from 'vitest';
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
  readFileSync(fileURLToPath(new URL('../evals/cases.json', import.meta.url)), 'utf8'),
).cases as Case[];

describe('evals/cases.json', () => {
  for (const c of cases) {
    it(c.id, () => {
      const res = check(c.request);
      expect(res.verdict, res.reason).toBe(c.expect.verdict);
      if (c.expect.kind) expect(res.kind).toBe(c.expect.kind);
      if (c.expect.exit_code !== undefined) expect(EXIT[res.verdict]).toBe(c.expect.exit_code);
      const summary = [res.title, res.reason, ...res.warnings, ...res.fields.map((f) => `${f.label} ${f.value}`)].join('\n');
      for (const needle of c.expect.summary_contains ?? []) {
        expect(summary.toLowerCase()).toContain(needle.toLowerCase());
      }
    });
  }
});
