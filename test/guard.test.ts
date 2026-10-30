import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes, keccak256, parseEther, recoverAddress, hashTypedData, type Hex } from 'viem';
import { check } from '../src/guard.js';
import { encodeRlp, bigIntToBytes } from '../src/rlp.js';
import type { SignRequest } from '../src/types.js';

// ---------------------------------------------------------------------------
// Real chain data — cited in demo/binance14.ts and README.md
// Authorization #15 of tx 0xad99264d…051298b (block 26300753, 2026-10-29T20:20:59Z),
// signed by Binance 14 (0x28C6…1d60) per
// https://808bits.com/articles/binance-hot-wallet-eip-7702-delegations/
// ---------------------------------------------------------------------------

const BINANCE14_AUTH_PREIMAGE = '0x05db019463e842b054bd624a465454d533c33f573e9c6fae8401209df9' as Hex;
const BINANCE14_AUTH = {
  delegate: '0x63e842B054Bd624a465454D533C33F573e9c6fAe' as `0x${string}`,
  chainId: 1,
  nonce: 18914809n,
  signature: {
    yParity: 0,
    r: '0xed435cb6590c132cb816dbd0dde4a21b8aaf7eea84927bc8950c314e9a92709a',
    s: '0x1da64aaca69487253b1cb1cfff1977631c134d985f2c625450370850870adc75',
  } as const,
};
const BINANCE14 = '0x28C6c06298d514Db089934071355E5743bf21d60';

const hardhat0 = {
  // Hardhat/Anvil default account #0 — well-known TEST key, never real funds.
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
} as const;

function authPreimage(chainId: bigint, delegate: `0x${string}`, nonce: bigint): Hex {
  return bytesToHex(new Uint8Array([0x05, ...encodeRlp([bigIntToBytes(chainId), hexToBytes(delegate), bigIntToBytes(nonce)])]));
}

function typedTxPreimage(type: number, fields: (Uint8Array | Uint8Array[] | Uint8Array[][])[]): Hex {
  return bytesToHex(new Uint8Array([type, ...encodeRlp(fields as never)]));
}

describe('bare digest', () => {
  it('refuses a bare 32-byte hash', () => {
    const res = check({ hash: keccak256('0xdeadbeef') });
    expect(res.verdict).toBe('REFUSE');
    expect(res.kind).toBe('bare-hash');
    expect(res.reason).toMatch(/can’t see what this signs/i);
  });
});

describe('EIP-7702 authorization (0x05)', () => {
  it('blocks the real Binance 14 authorization and proves the signature', async () => {
    const hash = keccak256(BINANCE14_AUTH_PREIMAGE);
    const res = check({ hash, preimage: BINANCE14_AUTH_PREIMAGE });
    expect(res.verdict).toBe('BLOCK');
    expect(res.kind).toBe('eip7702-authorization');
    expect(res.title).toContain('0x63e842B054Bd624a465454D533C33F573e9c6fAe');
    expect(res.fields.find((f) => f.label === 'nonce')!.value).toBe('18914809');
    expect(res.fields.find((f) => f.label === 'chain_id')!.value).toBe('1');

    // The digest + the real signature recover to Binance 14 — proof the payload is genuine.
    const recovered = await recoverAddress({ hash, signature: BINANCE14_AUTH.signature });
    expect(recovered).toBe(BINANCE14);
  });

  it('flags chain_id 0 as valid on every chain', () => {
    const res = check({ preimage: authPreimage(0n, hardhat0.address, 1n) });
    expect(res.verdict).toBe('BLOCK');
    expect(res.warnings.join(' ')).toMatch(/EVERY CHAIN/);
  });

  it('labels a zero-address delegate as a revocation', () => {
    const res = check({ preimage: authPreimage(1n, '0x0000000000000000000000000000000000000000', 7n) });
    expect(res.verdict).toBe('BLOCK');
    expect(res.fields.find((f) => f.label === 'effect')!.value).toMatch(/REVOCATION/);
  });

  it('downgrades an allowlisted delegate+chain to confirmation', () => {
    const res = check(
      { preimage: BINANCE14_AUTH_PREIMAGE },
      { allowlist: [{ delegate: BINANCE14_AUTH.delegate, chainId: 1 }] },
    );
    expect(res.verdict).toBe('ALLOW_WITH_CONFIRMATION');
    expect(res.reason).toMatch(/allowlist/i);
  });

  it('does not downgrade on address match alone — chain_id must match too', () => {
    const res = check(
      { preimage: BINANCE14_AUTH_PREIMAGE },
      { allowlist: [{ delegate: BINANCE14_AUTH.delegate, chainId: 56 }] },
    );
    expect(res.verdict).toBe('BLOCK');
  });
});

describe('set-code transaction (0x04)', () => {
  const delegate = '0x63e842B054Bd624a465454D533C33F573e9c6fAe' as `0x${string}`;
  const tx = (authList: unknown[][]) =>
    typedTxPreimage(0x04, [
      bigIntToBytes(1n), // chainId
      bigIntToBytes(10n), // nonce
      bigIntToBytes(1_000_000_000n), // maxPriorityFee
      bigIntToBytes(200_000_000_000n), // maxFee
      bigIntToBytes(1_000_000n), // gas
      hexToBytes(BINANCE14), // to
      bigIntToBytes(0n), // value
      new Uint8Array(0), // data
      [], // accessList
      authList as never, // authorizationList
    ]);

  it('blocks a 0x04 transaction carrying authorizations', () => {
    const preimage = tx([
      [bigIntToBytes(1n), hexToBytes(delegate), bigIntToBytes(5n), bigIntToBytes(0n), new Uint8Array(32), new Uint8Array(32)],
      [bigIntToBytes(1n), hexToBytes(delegate), bigIntToBytes(6n), bigIntToBytes(0n), new Uint8Array(32), new Uint8Array(32)],
    ]);
    const res = check({ preimage });
    expect(res.verdict).toBe('BLOCK');
    expect(res.reason).toMatch(/delegation/i);
    expect(res.fields.filter((f) => f.label.startsWith('authorization['))).toHaveLength(2);
  });
});

describe('EIP-191 signed data (0x19)', () => {
  it('decodes personal_sign and shows the message text', () => {
    const msg = 'I am authorizing login for agent.example';
    const preimage = bytesToHex(
      new Uint8Array([
        0x19,
        0x45,
        ...new TextEncoder().encode(`thereum Signed Message:\n${msg.length}`),
        ...new TextEncoder().encode(msg),
      ]),
    ) as Hex;
    const res = check({ preimage });
    expect(res.verdict).toBe('ALLOW_WITH_CONFIRMATION');
    expect(res.fields.find((f) => f.label === 'message')!.value).toBe(msg);
  });

  it('decodes version 0x00: validator + data', () => {
    const validator = '0x000000000000000000000000000000000000beef';
    const preimage = bytesToHex(new Uint8Array([0x19, 0x00, ...hexToBytes(validator), ...hexToBytes('0xdecafbad')])) as Hex;
    const res = check({ preimage });
    expect(res.verdict).toBe('ALLOW_WITH_CONFIRMATION');
    expect(res.fields.find((f) => f.label === 'validator')!.value.toLowerCase()).toBe(validator);
  });

  it('refuses an unknown 0x19 version', () => {
    const res = check({ preimage: '0x1942cafe' });
    expect(res.verdict).toBe('REFUSE');
    expect(res.kind).toBe('eip191-unknown-version');
  });
});

describe('EIP-712 typed data (0x19 0x01)', () => {
  const permitTypedData = {
    domain: {
      name: 'USD Coin',
      version: '2',
      chainId: 1,
      verifyingContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
    types: {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'Permit',
    message: {
      owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      spender: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      value: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
      nonce: '0',
      deadline: '1893456000',
    },
  };

  it('flags a Permit as an approval-style grant, loudly', () => {
    const res = check({ typedData: permitTypedData });
    expect(res.verdict).toBe('ALLOW_WITH_CONFIRMATION');
    expect(res.warnings.join(' ')).toMatch(/APPROVAL/i);
    expect(res.fields.find((f) => f.label === 'primaryType')!.value).toBe('Permit');
    expect(res.fields.find((f) => f.label === 'domain.name')!.value).toBe('USD Coin');
  });

  it('recomputes the digest and verifies a given hash', () => {
    const digest = hashTypedData(permitTypedData as Parameters<typeof hashTypedData>[0]);
    const res = check({ hash: digest, typedData: permitTypedData });
    expect(res.verdict).toBe('ALLOW_WITH_CONFIRMATION');
    expect(res.hash).toBe(digest);
  });

  it('refuses typed data that does not match the given hash', () => {
    const res = check({ hash: keccak256('0xbeef'), typedData: permitTypedData });
    expect(res.verdict).toBe('REFUSE');
    expect(res.kind).toBe('digest-mismatch');
  });

  it('blocks a bare 0x1901 digest with no typed data', () => {
    const preimage = bytesToHex(new Uint8Array([0x19, 0x01, ...new Uint8Array(32).fill(0xaa), ...new Uint8Array(32).fill(0xbb)])) as Hex;
    const res = check({ preimage });
    expect(res.verdict).toBe('BLOCK');
    expect(res.warnings.join(' ')).toMatch(/typed data/i);
  });
});

describe('transactions', () => {
  it('decodes an EIP-1559 ETH transfer for confirmation', () => {
    const preimage = typedTxPreimage(0x02, [
      bigIntToBytes(1n),
      bigIntToBytes(42n),
      bigIntToBytes(1_500_000_000n),
      bigIntToBytes(30_000_000_000n),
      bigIntToBytes(21_000n),
      hexToBytes('0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5'),
      bigIntToBytes(parseEther('0.25')),
      new Uint8Array(0),
      [],
    ]);
    const res = check({ preimage });
    expect(res.verdict).toBe('ALLOW_WITH_CONFIRMATION');
    expect(res.title).toMatch(/0\.25 ETH/);
    expect(res.fields.find((f) => f.label === 'to')!.value).toBe('0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5');
    expect(res.fields.find((f) => f.label === 'data')!.value).toMatch(/plain ETH transfer/);
  });

  it('decodes calldata and flags an unlimited approve', () => {
    // approve(spender, uint256 max) — selector 0x095ea7b3
    const data = ('0x095ea7b3' +
      '00000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc45' +
      'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') as Hex;
    const preimage = typedTxPreimage(0x02, [
      bigIntToBytes(1n),
      bigIntToBytes(7n),
      bigIntToBytes(1_000_000_000n),
      bigIntToBytes(20_000_000_000n),
      bigIntToBytes(100_000n),
      hexToBytes('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'), // USDC
      bigIntToBytes(0n),
      hexToBytes(data),
      [],
    ]);
    const res = check({ preimage });
    expect(res.verdict).toBe('ALLOW_WITH_CONFIRMATION');
    expect(res.fields.find((f) => f.label === 'data')!.value).toMatch(/approve\(0x68b3…|approve\(/);
    expect(res.warnings.join(' ')).toMatch(/UNLIMITED/i);
  });

  it('decodes a legacy RLP transaction', () => {
    const preimage = bytesToHex(
      encodeRlp([
        bigIntToBytes(9n),
        bigIntToBytes(20_000_000_000n),
        bigIntToBytes(21_000n),
        hexToBytes('0x3535353535353535353535353535353535353535'),
        bigIntToBytes(parseEther('1')),
        new Uint8Array(0),
      ]),
    ) as Hex;
    const res = check({ preimage });
    expect(res.verdict).toBe('ALLOW_WITH_CONFIRMATION');
    expect(res.kind).toBe('legacy-transaction');
    expect(res.title).toMatch(/1 ETH/);
  });
});

describe('refusals', () => {
  it('refuses a hash/preimage mismatch', () => {
    const res = check({ hash: keccak256('0xdeadbeef'), preimage: '0x05db019463e842b054bd624a465454d533c33f573e9c6fae8401209df9' });
    expect(res.verdict).toBe('REFUSE');
    expect(res.kind).toBe('digest-mismatch');
  });

  it('refuses an unknown prefix', () => {
    const res = check({ preimage: '0x0a1234' });
    expect(res.verdict).toBe('REFUSE');
    expect(res.kind).toBe('unknown-prefix');
  });

  it('refuses a malformed 0x05 payload', () => {
    const res = check({ preimage: '0x05ff' });
    expect(res.verdict).toBe('REFUSE');
    expect(res.kind).toBe('malformed');
  });

  it('refuses an invalid digest size', () => {
    const res = check({ hash: '0x1234' as Hex });
    expect(res.verdict).toBe('REFUSE');
  });
});
