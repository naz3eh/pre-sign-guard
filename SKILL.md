---
name: pre-sign-guard
description: Use before any EVM signature an agent or signing service is asked to produce — personal_sign, eth_signTypedData, transaction signing, or a bare digest. Refuses digests with no visible preimage, blocks EIP-7702 delegations by default, and renders every other payload as plain words a human can confirm.
---

# pre-sign-guard — never sign what you cannot see.

A signature is not a checksum. It is an authorization, and most of what a key is
asked to sign — a bare hash, an opaque hex blob — arrives with no visible
meaning at all. This skill is the rule and the tool that decides whether a
request may pass.

## The rule

Before producing any signature:

1. **Get the preimage.** A 32-byte digest alone cannot be evaluated — REFUSE
   it. Whatever asks you to sign must show what the hash commits to.
2. **Run the guard** (`bin/guard check <payload>`, or apply the byte-level
   rules in [skills/pre-sign-guard/references/formats.md](skills/pre-sign-guard/references/formats.md)
   by hand). The guard exits non-zero on BLOCK and REFUSE.
3. **Explain the payload in plain words** — what it is, what it grants, what it
   does not limit.
4. **Get explicit human confirmation.** BLOCK means stop — do not sign, do not
   ask the same request again with different wording.

## The skill

Read [skills/pre-sign-guard/SKILL.md](skills/pre-sign-guard/SKILL.md) for the
full operating procedure, and the runnable checker in `src/` + `bin/guard`.
