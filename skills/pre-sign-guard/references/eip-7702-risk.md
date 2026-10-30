# eip-7702-risk.md — why amount/destination policies miss delegations

A policy engine that inspects *destination, amount, and calldata* is checking
fields a signature may not have. An EIP-7702 authorization has none of them:
its preimage is 29 bytes — a magic byte, a chain id, a delegate address, a
nonce. The thing it grants is invisible to a field check: **“run that
contract’s code as me,” once, at a matching nonce — and the delegation stays on
the account until another authorization replaces it.**

## What the chain actually showed (Oct 29–30, 2026)

The facts below are from the cited sources, not from this project’s claims:

- At 20:20:59 UTC on 29 October 2026, a type-4 transaction carrying **fifty
  EIP-7702 authorizations** landed in Ethereum block 26300753. Every entry was
  signed by the **Binance 14** hot wallet
  (`0x28C6c06298d514Db089934071355E5743bf21d60`), all to one delegate
  (`0x63e842B054Bd624a465454D533C33F573e9c6fAe`), chain_id 1, consecutive
  nonces 18914775–18914824 — a window wide enough that whichever nonce was live
  when the carrier executed, one entry would match. Entry #15
  (nonce 18914809) took effect. Roughly three minutes later the delegate
  emptied the wallet: 167,464 ETH and 63 tokens — 808bits values them at
  $2.5–2.8B at that evening’s explorer prices.
  Sources:
  [808bits byte-level breakdown](https://808bits.com/articles/binance-hot-wallet-eip-7702-delegations/),
  [0xQuit’s thread](https://x.com/0xQuit/status/2115913970075009439),
  carrier tx
  [`0xad99264d5532ae0dd04b2004eebda05f25657e70dacb764f7ac8d4ccd051298b`](https://etherscan.io/tx/0xad99264d5532ae0dd04b2004eebda05f25657e70dacb764f7ac8d4ccd051298b)
  (verifiable on chain — the demo replays its bytes).
- Binance’s statement (02:25 UTC, 30 Oct): a compromised DevOps laptop gave
  access to a service container and withdrawal transactions were submitted
  through it — *“no evidence of any wallet private key leak”* — with ~$6.3B
  estimated total impact and ~$3B frozen on-chain. The affected address
  authorization was revoked.
  Source: [Binance statement](https://x.com/binance/status/2115993361517891592).
- 808bits’ reading: a signing path that is *handed digests* and signs them in
  the ordinary course of its work is exactly what the fifty-wide nonce window
  looks like from outside. A request beginning `0x05` reached the signer at
  all — that is the question a post-mortem has to answer.

## The policy hole, concretely

A hot-wallet or agent signing policy typically reasons like:

- *transfer → check `to` and `value` against limits*
- *call → check `data` for dangerous methods*
- *anything else → ???*

An authorization preimage fails every branch politely:

```
05 db 01 94 <delegate:20> 84 <nonce>
```

There is no `to`, no `value`, no `data`. What the signature *does* is attach a
delegation indicator (`0xef0100 || address`) to the account — the account now
executes the delegate’s code for `CALL`-family operations (and incoming calls),
per [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) “Behavior” and
“Delegation indicator”. One nonce window later, the sweeper ran once and took
everything.

So the rule the guard enforces is structural, not value-based: **classify the
preimage by its first byte, and give `0x05` (and a type-4 transaction’s
`authorization_list`) its own default — BLOCK — because nothing downstream can
see what it grants.**

Custody providers do ship controls for this class — Turnkey's
`eth.eip_7702_authorization` policies, Privy's `eth_sign7702Authorization`
rules, Coinbase CDP's `signEvmHash` rejection (links in the README's prior-art
section). They gate requests that pass through their engines; this document
covers the lane they can't reach — a request path that is already compromised
upstream, or a signer that signs digests it is handed.

## What this guard is, and is not

It is a check *in front of* a key that signs what it is handed — an agent with
a signing tool, a hot-wallet policy lane, an MCP `sign` call. It is not a claim
that it would have stopped this incident: the report describes a request path
that was already compromised *upstream* — a guard can only refuse what it is
shown, and only while the calling side honors its verdicts. Defense in depth
still needs key custody, request-path integrity, and review of which services
may ask for signatures at all.

## Sources

- 808bits, “Binance hot wallet signed 50 authorizations 3 minutes before the
  drain” — <https://808bits.com/articles/binance-hot-wallet-eip-7702-delegations/>
  (and their [raw transaction decoder](https://808bits.com/), which renders
  this exact transaction byte-by-byte in the browser)
- Binance, incident statement —
  <https://x.com/binance/status/2115993361517891592>
- 0xQuit thread — <https://x.com/0xQuit/status/2115913970075009439>
- [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) — authorization tuple,
  `MAGIC = 0x05`, delegation indicator, chain_id-0 semantics
- [EIP-191](https://eips.ethereum.org/EIPS/eip-191) ·
  [EIP-712](https://eips.ethereum.org/EIPS/eip-712) ·
  [EIP-2718](https://eips.ethereum.org/EIPS/eip-2718) — the other prefixes the
  guard decodes
