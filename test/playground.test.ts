// Parity test: the committed playground bundle must give the same verdicts as
// the library the CLI uses — the bundle is the real src/ code, never a copy.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
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
const BUNDLE = join(root, 'playground/bundle.js');

function loadBundle() {
  // Browser-ish globals the bundled library needs in a bare vm context.
  const sandbox: Record<string, unknown> = { TextEncoder, TextDecoder, crypto };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(BUNDLE, 'utf8'), sandbox, { filename: 'bundle.js' });
  const ns = sandbox.PreSignGuard as
    | { check: (r: unknown) => { verdict: string; kind: string; fields: unknown[] } }
    | undefined;
  if (!ns?.check) throw new Error('bundle did not expose PreSignGuard.check — run npm run build:playground');
  return ns;
}

// Cross-check against the library itself (same code the CLI runs).
const { check: libCheck } = await import('../src/index.js');

describe('playground bundle (playground/bundle.js)', () => {
  const PSG = loadBundle();

  it('exposes the real check() from src/', () => {
    expect(typeof PSG.check).toBe('function');
  });

  for (const ex of EXAMPLES) {
    it(`${ex.id} → ${ex.expect.verdict} (${ex.expect.kind})`, () => {
      const res = PSG.check(ex.request);
      expect(res.verdict, `bundle verdict for ${ex.id}`).toBe(ex.expect.verdict);
      expect(res.kind, `bundle kind for ${ex.id}`).toBe(ex.expect.kind);
      // …and identical to the unbundled library — bundle and CLI cannot disagree.
      const lib = libCheck(ex.request as never);
      expect(res.verdict).toBe(lib.verdict);
      expect(res.kind).toBe(lib.kind);
    });
  }
});
