# integration.md — putting the guard in front of a signer

The guard is a pure function over a signing request. Everything it needs is in
the request itself — no network, no state, no keys. Drop it on the path
between *"asked to sign"* and *"signed"*.

## As a CLI gate

```sh
# refuses: bare digest
guard check 0x<32 bytes>

# decodes + verdicts: preimage, or digest+preimage JSON
guard check 0x05db019463e842b054bd624a465454d533c33f573e9c6fae8401209df9
guard check '{"hash":"0x…","preimage":"0x05db…"}'
guard check @request.json          # same JSON, from a file
cat request.json | guard check -   # stdin
```

Exit codes are the contract: `0` ALLOW_WITH_CONFIRMATION · `2` BLOCK ·
`3` REFUSE · `64` usage error. A wrapper script that calls your signer can gate
on `$?` directly:

```sh
if ! guard check "$payload" --json > /tmp/verdict.json; then
  exit 1   # BLOCK or REFUSE — do not sign
fi
# show fields, get human confirmation, then sign
```

`--json` prints the full `CheckResult` (`verdict`, `kind`, `title`, `fields`,
`warnings`, `reason`, `hash`) for machine handling.

## As a library

```ts
import { check } from 'pre-sign-guard';       // or: import from './src/index.js'

const res = check({
  hash: '0x…',           // digest the signer was asked to sign
  preimage: '0x…',       // what it hashes to (optional; omit → REFUSE)
  typedData,             // EIP-712 JSON when the payload is 0x19 0x01 (optional)
});

if (res.verdict !== 'ALLOW_WITH_CONFIRMATION') throw new SigningRefused(res);
// show res.fields + res.warnings, wait for a human yes, then sign
```

## The allowlist

Delegations (`0x05` payloads and `authorization_list` entries) BLOCK by
default. An explicit `{delegate, chain_id}` pair downgrades them to
confirmation — use it for delegates your system deliberately adopts (a reviewed
smart-wallet implementation on one chain), never as a blanket “allow 7702”:

```sh
guard check "$payload" --allow 0xDELEGATE:1
guard check "$payload" --allowlist allowlist.json   # {"allow":[{"delegate":"0x…","chainId":1}]}
```

`chain_id` must match exactly — an authorization with `chain_id: 0` (valid on
every chain) only passes an entry that also says `0`.

## In front of an agent (MCP-style)

The clean pattern for an agent that has a `sign` tool: **keep the signer
blind, and let the guard be the only way it sees a request.**

- Wire the tool so `sign(request)` internally runs `check(request)` first —
  BLOCK/REFUSE returns the verdict to the agent and produces no signature;
  ALLOW_WITH_CONFIRMATION surfaces the decoded fields to the user for a
  confirmation step before any signature is made.
- Or keep two tools — `guard_check` and `sign` — and state in the skill that
  `sign` may only follow a confirmed `ALLOW_WITH_CONFIRMATION` on the same
  payload. The tool pair only works if `sign` can also verify the payload
  itself; prefer the first pattern.
- Hand the agent the payload **with its preimage** by contract: requests that
  carry only a digest are REFUSEd, which is the behavior you want in the tool,
  not something the model has to remember.

## In front of a wallet/signing service

Put the guard on the request boundary of the signer, not inside the wallet UI:

- A `POST /sign` handler runs `check()` first; non-ALLOW verdicts are rejected
  with the guard's `reason` — the signer never sees a request it can't decode.
- Log the decoded `kind`, `fields`, and `warnings` next to every signature.
  “Authorization list of 50, one delegate, consecutive nonces” is the kind of
  shape worth an alert on even when it is technically allowlisted.
- Approval-style fields (Permit, approve, setApprovalForAll) are surfaced as
  warnings — your service can require a second reviewer for those without
  blocking ordinary traffic.

## What the guard deliberately does not do

It never validates a *signature* (that's a different problem), never talks to
the chain (offline by design — no RPC, no secrets), and never overrides a human
verdict. It is a gate, not a signer.
