# formats.md — what each byte prefix actually signs

Every payload the guard understands is classified by its first byte. Layouts
below are verified against the EIP texts (section names cited); the decoders in
`src/guard.ts` implement exactly these.

## `0x05` — EIP-7702 authorization

```
0x05  ||  rlp([chain_id, address, nonce])
```

The signed message for one authorization tuple, per
[EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) "Set code transaction →
Behavior": `msg = keccak(MAGIC || rlp([chain_id, address, nonce]))` with
`MAGIC = 0x05`. 29 bytes for a mainnet-chain example:

```
05                                              magic byte
db                                              RLP list, 27 bytes follow
   01                                           chain_id = 1
   94 63e842b054bd624a465454d533c33f573e9c6fae  delegate (20 bytes)
   84 01209df9                                  nonce = 18914809
```

Real bytes from authorization #15 of carrier tx
`0xad99264d5532ae0dd04b2004eebda05f25657e70dacb764f7ac8d4ccd051298b`
(block 26300753), signed by Binance 14 — see
[808bits](https://808bits.com/articles/binance-hot-wallet-eip-7702-delegations/)
for the byte-level write-up.

- `chain_id: 0` → valid on **every** chain (EIP-7702 behavior step 1: "Verify
  the chain ID is 0 or the ID of the current chain").
- `address` = the delegate — its code executes *as the account* until replaced
  (behavior step 8: code set to `0xef0100 || address`).
- `address = 0x000…000` → **revocation**: clears delegated code (same step 8).
- What the signature *doesn't* carry: amount, destination, calldata, expiry.
- Field bounds (EIP-7702): `chain_id < 2**256`, `nonce < 2**64`,
  `len(address) == 20`. On-chain tuples append `y_parity, r, s`.

Verdict: **BLOCK** by default. Only an explicit `{delegate, chain_id}` allowlist
downgrades to `ALLOW_WITH_CONFIRMATION`.

## `0x19` — EIP-191 signed data

```
0x19 || <1-byte version> || <version-specific data> || <data to sign>
```

Per [EIP-191](https://eips.ethereum.org/EIPS/eip-191) "Specification" and
"Registry of version bytes". Registered versions:

| version | layout | guard behavior |
| --- | --- | --- |
| `0x00` | `0x19 0x00 <20B intended validator> <data>` | Show validator + data → `ALLOW_WITH_CONFIRMATION` |
| `0x01` | `0x19 0x01 <32B domainSeparator> <32B hashStruct>` | EIP-712 — see below |
| `0x45` | `0x19 'E' "thereum Signed Message:\n" <decimal len> <message>` | `personal_sign` — decode and show the message → `ALLOW_WITH_CONFIRMATION` |
| other | — | **REFUSE** — unregistered version |

### `0x19 0x01` — EIP-712 typed data

Per [EIP-712](https://eips.ethereum.org/EIPS/eip-712) "Specification":
`encode = "\x19\x01" ‖ domainSeparator ‖ hashStruct(message)` where
`domainSeparator = hashStruct(EIP712Domain)` and
`hashStruct(s) = keccak256(typeHash ‖ encodeData(s))`.

- With the typed data JSON supplied (`{"typedData": …}`), the guard recomputes
  the digest (`keccak256(0x1901 ‖ domainSeparator ‖ hashStruct)`) and requires
  it to match, then displays `domain`, `primaryType`, and every `message`
  field → `ALLOW_WITH_CONFIRMATION`.
- `Permit` / `PermitSingle` / `PermitBatch` / approval-style types and
  `spender`/`operator`/`approved` message fields are flagged loudly.
- Without typed data the two 32-byte blobs are opaque → **BLOCK** (resubmit
  with the typed data JSON).

## `0x01`–`0x04` — typed transactions

Per [EIP-2718](https://eips.ethereum.org/EIPS/eip-2718) the payload is
`TransactionType || TransactionPayload` where `TransactionPayload` is an RLP
list. Field order (unsigned signing form; a signed tx appends
`y_parity, r, s`):

| type | EIP | fields |
| --- | --- | --- |
| `0x01` | [2930](https://eips.ethereum.org/EIPS/eip-2930) | chain_id, nonce, gas_price, gas_limit, to, value, data, access_list |
| `0x02` | [1559](https://eips.ethereum.org/EIPS/eip-1559) | chain_id, nonce, max_priority_fee, max_fee, gas_limit, to, value, data, access_list |
| `0x03` | [4844](https://eips.ethereum.org/EIPS/eip-4844) | 0x02 fields + max_fee_per_blob_gas, blob_versioned_hashes |
| `0x04` | [7702](https://eips.ethereum.org/EIPS/eip-7702) | 0x02 fields + authorization_list |

The guard displays chain_id, nonce, to, value (ETH), gas fields, and decodes
`data` (4-byte selector) against a small known ABI — `transfer`, `approve`,
`setApprovalForAll`, `permit`, `transferFrom`, `deposit`, `withdraw`,
`multicall`, `execute`, `swapExactTokensForTokens`. An `approve` for
type(uint256).max and `setApprovalForAll(_, true)` get loud warnings.

**`0x04` authorizations are decoded one by one** — each is the same grant as a
bare `0x05` — and the transaction **BLOCKs** like a `0x05` payload unless every
authorization is allowlisted. An empty `authorization_list` is invalid per the
EIP and flagged.

## `≥ 0xc0` — legacy transaction

A first byte ≥ `0xc0` means the preimage itself is an RLP list (0xc0–0xff is
the RLP list range — Yellow Paper, Appendix B). Layout:

```
rlp([nonce, gasPrice, gasLimit, to, value, data])          unsigned
rlp([nonce, gasPrice, gasLimit, to, value, data, v, r, s])  signed
```

Displayed like a typed transaction → `ALLOW_WITH_CONFIRMATION`. `v ≥ 35`
embeds an EIP-155 chain_id (`(v − 35) / 2`).

## Everything else

- 32-byte digest with no preimage → **REFUSE** (bare hash).
- `keccak256(preimage)` ≠ supplied digest → **REFUSE** (inconsistent request).
- Any other first byte, malformed RLP, or wrong field count → **REFUSE**.

## A note on `0xef`

`0xef0100 || address` is the delegation *indicator* written to account code
on-chain (EIP-7702 "Delegation indicator"; `0xef` is the EIP-3541 banned
opcode). It is chain state, not a signing payload — but if it ever arrives as a
request, the unknown-prefix rule refuses it anyway.
