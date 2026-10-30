// demo/binance14.ts — replays a REAL signing request through the guard.
//
// Case 1 is the sixteenth EIP-7702 authorization carried on chain in
// transaction 0xad99264d5532ae0dd04b2004eebda05f25657e70dacb764f7ac8d4ccd051298b
// (Ethereum block 26300753, 2026-10-29T20:20:59Z): fifty authorizations signed
// by the Binance 14 hot wallet (0x28C6c06298d514Db089934071355E5743bf21d60),
// all delegating to contract 0x63e842B054Bd624a465454D533C33F573e9c6fAe,
// chain_id 1, consecutive nonces 18914775–18914824, carried by
// 0x7C8601d4645b93cea45F71E118A729332e6b5CA0.
//
// Sources:
//   - chain data: eth_getBlockByNumber(26300753) → the transaction above
//   - byte-level write-up: https://808bits.com/articles/binance-hot-wallet-eip-7702-delegations/
//   - encoding rule: EIP-7702, "Set code transaction → Behavior" — the signed
//     message is keccak256(0x05 || rlp([chain_id, address, nonce]))
//
// Cases 2 and 3 are constructed test vectors, clearly labeled.

import { recoverAddress, keccak256, hexToBytes, bytesToHex, parseEther, type Hex } from 'viem';
import { check } from '../src/guard.js';
import { render } from '../src/cli.js';
import { encodeRlp, bigIntToBytes } from '../src/rlp.js';
import type { SignRequest } from '../src/types.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

// --- real chain data (cited above) -------------------------------------------

const BINANCE14_AUTH_PREIMAGE =
  '0x05db019463e842b054bd624a465454d533c33f573e9c6fae8401209df9' as Hex;
const BINANCE14_AUTH_SIGNATURE = {
  yParity: 0,
  r: '0xed435cb6590c132cb816dbd0dde4a21b8aaf7eea84927bc8950c314e9a92709a',
  s: '0x1da64aaca69487253b1cb1cfff1977631c134d985f2c625450370850870adc75',
} as const;
const BINANCE14 = '0x28C6c06298d514Db089934071355E5743bf21d60';
const CARRIER_TX = '0xad99264d5532ae0dd04b2004eebda05f25657e70dacb764f7ac8d4ccd051298b';

// --- demo ---------------------------------------------------------------------

async function run() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  pre-sign-guard — what was the key actually asked to sign?');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Case 1 — the real Binance 14 authorization ---------------------------------
  console.log('');
  console.log('CASE 1 · a signing request arrives at a hot-wallet signer');
  console.log('  (real payload: authorization #15 of carrier tx ' + CARRIER_TX.slice(0, 12) + '…,');
  console.log('   Ethereum block 26300753, signed by Binance 14 — sources in demo/binance14.ts)');
  await sleep(1600);

  const req1: SignRequest = {
    hash: keccak256(BINANCE14_AUTH_PREIMAGE),
    preimage: BINANCE14_AUTH_PREIMAGE,
  };
  const res1 = check(req1);
  console.log('');
  console.log(render(res1, useColor));

  // prove the payload is the real one, not a lookalike:
  const recovered = await recoverAddress({
    hash: req1.hash!,
    signature: BINANCE14_AUTH_SIGNATURE,
  });
  console.log('');
  console.log(`  on-chain proof: the real signature on this digest recovers to ${recovered}`);
  console.log(`  ${recovered === BINANCE14 ? '= Binance 14 ✓' : '≠ Binance 14 — demo data is wrong!'}`);
  await sleep(2600);

  // Case 2 — a normal ETH transfer ---------------------------------------------
  console.log('');
  console.log('CASE 2 · a normal EIP-1559 ETH transfer (constructed test vector)');
  await sleep(1600);
  const tx = encodeRlp([
    bigIntToBytes(1n), // chainId 1
    bigIntToBytes(42n), // nonce
    bigIntToBytes(1500000000n), // maxPriorityFeePerGas 1.5 gwei
    bigIntToBytes(30000000000n), // maxFeePerGas 30 gwei
    bigIntToBytes(21000n), // gasLimit
    hexToBytes('0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5'), // to
    bigIntToBytes(parseEther('0.25')), // value
    new Uint8Array(0), // data
    [], // accessList
  ]);
  const preimage2 = bytesToHex(new Uint8Array([0x02, ...tx])) as Hex;
  const res2 = check({ preimage: preimage2 });
  console.log('');
  console.log(render(res2, useColor));
  await sleep(2600);

  // Case 3 — a bare digest -------------------------------------------------------
  console.log('');
  console.log('CASE 3 · the signer is handed only a 32-byte digest (constructed test vector)');
  await sleep(1600);
  const res3 = check({ hash: keccak256('0xdeadbeef') });
  console.log('');
  console.log(render(res3, useColor));
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  never sign what you cannot see.  https://github.com/naz3eh/pre-sign-guard');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

await run();
