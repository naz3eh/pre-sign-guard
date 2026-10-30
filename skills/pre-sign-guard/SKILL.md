---
name: pre-sign-guard
description: Use before any EVM signature an agent or signing service is asked to produce — personal_sign, eth_signTypedData, transaction signing, or a bare digest. Refuses digests with no visible preimage, blocks EIP-7702 delegations by default, and renders every other payload as plain words a human can confirm.
---

# pre-sign-guard

You sign things on request. Some requests are fine; some hand a key to whoever
wrote them. Your job is not to trust the requester — it is to make sure a human
sees exactly what the signature does before it exists.

## Before any signature, run this sequence

1. **Get the preimage.** If you are handed a bare 32-byte hash with no preimage,
   you cannot know what it commits to. Do not sign it, do not guess it. REFUSE:
   *"I can't see what this signs."*
2. **Verify the pair.** When a preimage arrives with a digest, recompute
   `keccak256(preimage)` and compare. A mismatch means the request is broken or
   tampered with — REFUSE.
3. **Classify by the first byte** of the preimage and decode the rest. The
   byte-level table is in [formats](references/formats.md); the one rule to
   memorize: **`0x05` is an EIP-7702 authorization** — it grants a contract
   the right to run as the signing account, and it carries no amount,
   destination, or calldata for a policy to check. BLOCK it by default.
4. **Prefer running the checker** over decoding by hand: from this repo,
   `bin/guard check <payload>` prints the decoded fields and a verdict
   (`ALLOW_WITH_CONFIRMATION`, `BLOCK`, `REFUSE`; exit 0/2/3). It accepts
   `0x…` hex, `{"hash","preimage","typedData"}` JSON, `@file`, or `-` (stdin).
5. **Explain it in plain words.** Not "EIP-7702 authorization, chain_id 1" —
   *"This lets contract 0x… run as your wallet on Ethereum mainnet, with no
   amount limit, until another authorization replaces it."*
6. **Get explicit confirmation from a human.** ALLOW_WITH_CONFIRMATION means
   show the fields and ask. BLOCK means stop — do not sign, do not reframe the
   request and try again.

## Verdicts

| Verdict | Meaning | What you do |
| --- | --- | --- |
| `ALLOW_WITH_CONFIRMATION` | The payload decoded cleanly. | Show the human exactly what it grants, in words. Sign only after a yes. |
| `BLOCK` | The request delegates the account or is otherwise dangerous-by-policy. | Stop. Explain why. An allowlisted delegate + chain_id is the only downgrade. |
| `REFUSE` | Unseen hash, tampered pair, malformed or unknown payload. | Refuse to sign. Ask for the preimage / typed data. |

## What to watch hardest

- **`0x05` anywhere.** A raw authorization, or inside a type-4 transaction's
  `authorization_list` — same grant, same BLOCK.
- **`chain_id: 0` in an authorization.** Valid on *every* chain, not just one.
- **Approval-style payloads.** `Permit`/`Permit2` typed data, `approve` and
  `setApprovalForAll` calldata — unlimited grants get said out loud.
- **Anything you can't decode.** Unknown prefix → REFUSE, never "probably fine".

## References

- [formats](references/formats.md) — the byte-level layouts this guard decodes, with EIP sections.
- [eip-7702-risk](references/eip-7702-risk.md) — why delegations slip past amount/destination policies.
- [integration](references/integration.md) — putting the guard in front of a signer, MCP tool, or wallet service.
- [test-plan](references/test-plan.md) — the case matrix and how to run it.

## Sources & related work

- [ef0100](https://github.com/ef0100dev/ef0100) — signer-side guard built on
  the same incident (KMS/HSM/MPC focus; live-nonce checks, rate limits, Solana).
- [808bits byte-level write-up](https://808bits.com/articles/binance-hot-wallet-eip-7702-delegations/)
  + [raw transaction decoder](https://808bits.com/tools/raw-transaction-decoder/).
- [ecdsa.com EIP-7702 decoder](https://ecdsa.com/tools/eip7702-decoder).
- Custody-side controls: [Turnkey 7702 policies](https://docs.turnkey.com/features/policies/examples/ethereum) ·
  [Privy `eth_sign7702Authorization` policies](https://docs.privy.io/controls/policies/example-policies/ethereum) ·
  [Coinbase CDP `signEvmHash` rules](https://docs.cdp.coinbase.com/api-reference/v2/rest-api/policy-engine/policy-engine).
- [@mattiascaricato — reject 0x05](https://x.com/mattiascaricato/status/2115976679042482265).
- Unrelated, similar name: [Fizzl13/presign-guard](https://github.com/Fizzl13/presign-guard)
  (hosted, paid check API).
