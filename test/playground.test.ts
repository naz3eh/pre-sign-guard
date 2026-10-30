// Parity test: every playground example must give the verdict + kind its card
// advertises. The playground imports the real check() from src/ (the same code
// the CLI runs), so library, playground and CLI cannot disagree — the rendered
// page itself is covered end-to-end by test/browser/playground.spec.ts.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

type Example = {
  id: string;
  request: { hash?: string; preimage?: string; typedData?: unknown };
  expect: { verdict: string; kind: string };
};

const EXAMPLES = JSON.parse(readFileSync(join(root, 'playground/examples.json'), 'utf8')) as Example[];

const { check } = await import('../src/index.js');

describe('playground examples (playground/examples.json)', () => {
  for (const ex of EXAMPLES) {
    it(`${ex.id} → ${ex.expect.verdict} (${ex.expect.kind})`, () => {
      const res = check(ex.request as never);
      expect(res.verdict, `verdict for ${ex.id}`).toBe(ex.expect.verdict);
      expect(res.kind, `kind for ${ex.id}`).toBe(ex.expect.kind);
    });
  }
});
