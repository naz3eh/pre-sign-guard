# Evals

Two layers:

**`cases.json` — executable guard cases.** Each entry feeds a signing request to
the guard and asserts the verdict (`ALLOW_WITH_CONFIRMATION` / `BLOCK` /
`REFUSE`), the payload `kind`, the CLI `exit_code`, and substrings the printed
summary must contain. Run with:

```sh
npm run evals      # standalone table
npm test           # also executes every case (test/evals.test.ts)
```

The `binance14-authorization-blocked` case is real chain data (carrier tx
`0xad99264d…051298b`, block 26300753, signed by Binance 14 — see
`demo/binance14.ts` for sources). Everything else is a constructed test vector
using well-known test accounts (the Hardhat/Anvil defaults) — no real keys,
ever.

**Agent behavior checks.** The same cases double as the spec an agent skill is
measured against: given a signing request, a correct agent refuses unseen
digests, blocks delegations it wasn't told to allow, decodes everything else
into plain words, and stops at BLOCK rather than reasoning its way around it.
`skills/pre-sign-guard/references/test-plan.md` lists the full matrix,
including cases that need a wider harness (JSON CLI mode, allowlist files,
stdin).
