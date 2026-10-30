# test-plan.md — the case matrix

Everything here is executable. `npm test` runs the vitest suite
(`test/guard.test.ts`) **and** every case in `evals/cases.json`
(`test/evals.test.ts`); `npm run evals` prints the case table standalone.
`npm run typecheck` runs `tsc --noEmit`.

## Decision matrix

| case | input | expected |
| --- | --- | --- |
| bare digest | `{"hash": "0x…64 hex chars"}` | `REFUSE` (bare-hash), exit 3 |
| digest + preimage, mismatch | `keccak(preimage) ≠ hash` | `REFUSE` (digest-mismatch), exit 3 |
| `0x05` authorization | real Binance 14 bytes, nonce 18914809 | `BLOCK` (eip7702-authorization), exit 2 |
| `0x05`, `chain_id: 0` | constructed | `BLOCK` + "valid on EVERY CHAIN" |
| `0x05`, zero delegate | constructed | `BLOCK`, shown as REVOCATION |
| `0x05`, allowlisted delegate+chain | constructed | `ALLOW_WITH_CONFIRMATION` |
| `0x04` set-code tx with authorization_list | constructed (real sig fields) | `BLOCK` (eip7702-set-code-tx) |
| `0x19 0x45` personal_sign | constructed | `ALLOW_WITH_CONFIRMATION`, message shown |
| `0x19 0x01` + typedData | Permit (unlimited spender) | `ALLOW_WITH_CONFIRMATION` + APPROVAL flag |
| `0x19 0x01` digest only | 66-byte preimage, no typedData | `BLOCK` (opaque — resubmit typed data) |
| `0x19 0x00` | validator + data | `ALLOW_WITH_CONFIRMATION` |
| `0x19` other version | `0x19 0x42 …` | `REFUSE` (unregistered version) |
| `0x02` ETH transfer | constructed | `ALLOW_WITH_CONFIRMATION`, fields shown |
| `0x02` + `approve(…, uint256.max)` | constructed | `ALLOW_WITH_CONFIRMATION` + UNLIMITED warning |
| legacy RLP tx | constructed | `ALLOW_WITH_CONFIRMATION` |
| unknown prefix | `0x0a…` | `REFUSE` (unknown-prefix) |
| malformed `0x05` | bad RLP | `REFUSE` (malformed) |
| digest not 32 bytes | `{"hash":"0x1234"}` | `REFUSE` (invalid-input) |

## Behavior contract for agents

Same cases, read as agent obligations (asserted via `evals/cases.json` fields
`verdict`, `kind`, `exit_code`, `summary_contains`):

- Never sign what you can't decode; never sign a bare digest.
- Always say what the signature *grants* in plain words before asking.
- `BLOCK` ends the conversation for that payload — no re-request with new wording.
- Allowlists are the only downgrade path, and they must name delegate **and** chain.

## Covered today vs. needs a wider harness

Covered by `npm test` + `npm run evals` (all deterministic, offline):

- every row of the decision matrix above
- the real Binance 14 authorization — including `ecrecover` of its real
  signature back to `0x28C6…1d60`, proving the payload is genuine chain data

Worth adding when the harness grows:

- CLI-level exit-code assertions via `bin/guard` subprocess (currently asserted
  through the verdict→exit mapping in `evals/run.ts`/`test/evals.test.ts`)
- `@file` / stdin payload paths, `--allowlist` file loading, `--json` output
- fuzzing: random prefixes and truncated RLP must always land in REFUSE,
  never throw

## Adding a case

1. Add the smallest failing row to `evals/cases.json` (`request` + `expect`).
2. `npm run evals` shows it failing; implement until it passes.
3. If the case needs a constructed payload, build it with `encodeRlp`/`bigIntToBytes`
   from `src/rlp.ts` — never hand-edit raw hex.
4. Real chain data gets a source comment (tx hash, block, and the write-up
   that decoded it) — never an invented address, hash, or signature.
