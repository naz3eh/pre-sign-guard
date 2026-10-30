# Agent Instructions

## Layout (mirror of zcashlabs/zcash-skills)

- `SKILL.md` at the root is the router skill: `name` + `description` frontmatter only.
- Each skill lives in `skills/<name>/SKILL.md` with the same minimal frontmatter
  (`<name>` lowercase-hyphen, equal to the directory name). Only `name` +
  `description` in frontmatter — everything else goes in the body.
- Supporting docs go in `skills/<name>/references/` — one level deep, no nested
  directories.
- Behavior cases live in `evals/cases.json`; `evals/run.ts` and `test/evals.test.ts`
  consume it.
- `index.html` is the GitHub Pages site; `docs/gen-manifest.py` regenerates the
  manifest it embeds. Re-run it whenever md files move.
- `playground/` is the Pages browser playground. `playground/src/main.ts` imports
  the real `src/` guard — never reimplement decode logic there. After changing
  `src/` or `playground/`, re-run `npm run build:playground` and commit the
  regenerated `playground/bundle.js` (CI fails on a stale bundle). Examples live
  in `playground/examples.json` — only repo fixtures or cited chain data.

## Hard rules

- **No fabricated chain data.** Every tx hash, address, nonce, chain_id and
  signature quoted in docs, tests or demos must come from chain data or a
  linked source. Never invent one — if it can't be fetched, say so and stop.
- **No real private keys.** Tests may only use widely-known public test keys
  (e.g. Hardhat/Anvil default accounts) and must label them.
- **No overclaiming.** Never claim the guard would have stopped the Binance
  incident (the signer was compromised upstream). Never call it "the first".
  Figures are attributed to their source or left out.
- Byte layouts must match the EIP texts and cite the section in
  `skills/pre-sign-guard/references/formats.md`.

## Checks

```sh
npm test            # vitest unit tests + evals/cases.json
npm run evals       # case table, standalone
npm run typecheck   # tsc --noEmit
python3 docs/gen-manifest.py   # regen index.html manifest after md moves
```

All checks run offline — the guard never talks to RPC.
