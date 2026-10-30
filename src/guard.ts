// pre-sign-guard: classify and decode an EVM signing request before a key signs it.
//
// Input is a SignRequest: a digest to sign, optionally with its preimage and/or
// EIP-712 typed data. Output is a verdict plus a plain-English rendering of the
// payload, laid out byte-for-byte per the EIPs (see references/formats.md):
//
//   0x05            EIP-7702 authorization  (EIP-7702 "Set code transaction")
//   0x19            EIP-191 signed data     (versions 0x00 / 0x01 / 0x45)
//   0x01–0x04       typed transactions      (EIP-2930 / 1559 / 4844 / 7702)
//   >= 0xc0         legacy RLP transaction  (Yellow Paper Appendix B)
//   anything else   unknown — refused

import {
  bytesToHex,
  formatEther,
  formatGwei,
  getAddress,
  hashTypedData,
  hexToBytes,
  isHex,
  keccak256,
  type Hex,
} from 'viem';
import { decodeRlp, RlpError, type RlpItem } from './rlp.js';
import { decodeCallData } from './abi.js';
import type { AllowEntry, CheckOptions, CheckResult, Field, SignRequest, Verdict } from './types.js';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const PERSONAL_SIGN_TAG = 'thereum Signed Message:\n'; // bytes after 0x19 0x45 ('E')

const TX_TYPES: Record<number, { name: string; fields: string[] }> = {
  // Unsigned signing payloads (no yParity/r/s); +3 trailing items is the signed form.
  0x01: {
    name: 'EIP-2930 access-list transaction',
    fields: ['chainId', 'nonce', 'gasPrice', 'gasLimit', 'to', 'value', 'data', 'accessList'],
  },
  0x02: {
    name: 'EIP-1559 transaction',
    fields: ['chainId', 'nonce', 'maxPriorityFeePerGas', 'maxFeePerGas', 'gasLimit', 'to', 'value', 'data', 'accessList'],
  },
  0x03: {
    name: 'EIP-4844 blob transaction',
    fields: ['chainId', 'nonce', 'maxPriorityFeePerGas', 'maxFeePerGas', 'gasLimit', 'to', 'value', 'data', 'accessList', 'maxFeePerBlobGas', 'blobVersionedHashes'],
  },
  0x04: {
    name: 'EIP-7702 set-code transaction',
    fields: ['chainId', 'nonce', 'maxPriorityFeePerGas', 'maxFeePerGas', 'gasLimit', 'to', 'value', 'data', 'accessList', 'authorizationList'],
  },
};

function refuse(kind: string, reason: string, hash?: Hex): CheckResult {
  return { verdict: 'REFUSE', kind, title: reason, fields: [], warnings: [], reason, ...(hash ? { hash } : {}) };
}

function result(
  verdict: Verdict,
  kind: string,
  title: string,
  fields: Field[],
  warnings: string[],
  reason: string,
  hash?: Hex,
  preimage?: Hex,
): CheckResult {
  return { verdict, kind, title, fields, warnings, reason, ...(hash ? { hash } : {}), ...(preimage ? { preimage } : {}) };
}

function bytesToBigInt(b: Uint8Array): bigint {
  let v = 0n;
  for (const x of b) v = (v << 8n) | BigInt(x);
  return v;
}

function asBytes(item: RlpItem): Uint8Array {
  if (item instanceof Uint8Array) return item;
  throw new RlpError('expected bytes, found list');
}

function asList(item: RlpItem): RlpItem[] {
  if (Array.isArray(item)) return item;
  throw new RlpError('expected list, found bytes');
}

function addr(b: Uint8Array): `0x${string}` {
  if (b.length === 0) return ZERO_ADDRESS as `0x${string}`;
  if (b.length !== 20) throw new RlpError(`address must be 20 bytes, got ${b.length}`);
  return getAddress(bytesToHex(b));
}

function isAllowlisted(allowlist: AllowEntry[] | undefined, delegate: string, chainId: bigint): boolean {
  return (allowlist ?? []).some(
    (e) => e.delegate.toLowerCase() === delegate.toLowerCase() && BigInt(e.chainId) === chainId,
  );
}

/**
 * Evaluate a signing request. Never throws for malformed input — a payload the
 * guard cannot interpret is REFUSEd, never silently allowed.
 */
export function check(req: SignRequest, opts: CheckOptions = {}): CheckResult {
  let hash = req.hash;
  const { typedData } = req;

  if (hash && (!isHex(hash) || hexToBytes(hash).length !== 32)) {
    return refuse('invalid-input', 'the digest is not a 32-byte hex string — cannot evaluate');
  }
  if (req.preimage !== undefined && !isHex(req.preimage)) {
    return refuse('invalid-input', 'the preimage is not hex — cannot evaluate', hash);
  }

  // EIP-712 typed data: recompute the digest and require it to match any given hash.
  if (typedData) {
    let digest: Hex;
    try {
      digest = hashTypedData(typedData as Parameters<typeof hashTypedData>[0]);
    } catch (e) {
      return refuse('malformed', `typed data could not be hashed: ${(e as Error).message}`, hash);
    }
    if (hash && hash.toLowerCase() !== digest.toLowerCase()) {
      return refuse(
        'digest-mismatch',
        'the supplied EIP-712 typed data does not hash to the given digest — the request is inconsistent (possibly tampered with)',
        hash,
      );
    }
    hash = digest;
  }

  let preimage: Hex | undefined = req.preimage;
  if (preimage !== undefined) {
    if (preimage === '0x' || hexToBytes(preimage).length === 0) {
      return refuse('invalid-input', 'empty preimage — nothing to evaluate', hash);
    }
    const computed = keccak256(preimage);
    if (hash && computed.toLowerCase() !== hash.toLowerCase()) {
      return refuse(
        'digest-mismatch',
        'keccak256(preimage) does not equal the given digest — the request is inconsistent (possibly tampered with)',
        hash,
      );
    }
    hash = computed;
  }

  if (!preimage) {
    if (typedData) return render712(typedData, hash!);
    if (hash) {
      return result(
        'REFUSE',
        'bare-hash',
        'A bare 32-byte digest — the request gives no preimage, so nothing can be shown about what it commits to.',
        [],
        [],
        'I can’t see what this signs. Refusing. Resubmit with the preimage (and typed data for EIP-712) so the payload can be decoded.',
        hash,
      );
    }
    return refuse('invalid-input', 'no digest, preimage, or typed data supplied — nothing to evaluate');
  }

  // From here: a preimage whose keccak equals `hash` (verified above).
  const bytes = hexToBytes(preimage);
  const digest = hash!;
  const b0 = bytes[0]!;
  try {
    if (b0 === 0x05) return decode7702(bytes.slice(1), opts, digest, preimage);
    if (b0 === 0x19) return decode191(bytes, typedData, digest, preimage);
    if (b0 >= 0x01 && b0 <= 0x04) return decodeTypedTx(b0, bytes.slice(1), opts, digest, preimage);
    if (b0 >= 0xc0) return decodeLegacyTx(bytes, digest, preimage);
    return refuse(
      'unknown-prefix',
      `unrecognized payload prefix 0x${b0.toString(16).padStart(2, '0')} — not a known signing format`,
      digest,
    );
  } catch (e) {
    if (e instanceof RlpError) {
      return refuse('malformed', `payload is not well-formed for its claimed format: ${e.message}`, hash);
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// 0x05 — EIP-7702 authorization: msg = keccak(0x05 || rlp([chain_id, address, nonce]))
// (EIP-7702, "Set code transaction → Behavior")
// ---------------------------------------------------------------------------

interface AuthFields {
  chainId: bigint;
  delegate: `0x${string}`;
  nonce: bigint;
}

function decodeAuthPreimage(rest: Uint8Array): AuthFields {
  const list = asList(decodeRlp(rest));
  if (list.length !== 3) throw new RlpError(`authorization preimage must be a 3-item list, got ${list.length}`);
  const chainId = bytesToBigInt(asBytes(list[0]!));
  const delegate = addr(asBytes(list[1]!));
  const nonce = bytesToBigInt(asBytes(list[2]!));
  return { chainId, delegate, nonce };
}

function decode7702(rest: Uint8Array, opts: CheckOptions, hash: Hex, preimage: Hex): CheckResult {
  const { chainId, delegate, nonce } = decodeAuthPreimage(rest);
  const revocation = delegate.toLowerCase() === ZERO_ADDRESS;
  const allowed = isAllowlisted(opts.allowlist, delegate, chainId);

  const fields: Field[] = [
    { label: 'chain_id', value: chainId.toString() },
    { label: 'delegate', value: delegate },
    { label: 'nonce', value: nonce.toString() },
  ];
  const warnings: string[] = [];
  if (chainId === 0n) warnings.push('chain_id = 0: this authorization is VALID ON EVERY CHAIN, not just one');
  if (revocation) fields.push({ label: 'effect', value: 'REVOCATION — clears any previously delegated code (delegate is the zero address)' });
  else
    fields.push({
      label: 'effect',
      value: `${delegate}’s code will execute AS THIS ACCOUNT — full control over its funds, with no amount or destination limit, until another authorization replaces it`,
    });

  const title = revocation
    ? `EIP-7702 authorization (revocation) on chain ${chainId} at nonce ${nonce}`
    : `EIP-7702 delegation → ${delegate} runs as this account on chain ${chainId}, nonce ${nonce}`;

  if (allowed) {
    return result(
      'ALLOW_WITH_CONFIRMATION',
      'eip7702-authorization',
      title,
      fields,
      warnings,
      'EIP-7702 delegation to an explicitly allowlisted delegate + chain_id. Still requires human confirmation — the signature carries no amount or destination.',
      hash,
      preimage,
    );
  }
  return result(
    'BLOCK',
    'eip7702-authorization',
    title,
    fields,
    warnings,
    'EIP-7702 delegation blocked by default. This signature hands the account to a contract and carries no amount, destination, or calldata for a policy to check. Only an allowlisted delegate + chain_id may pass.',
    hash,
    preimage,
  );
}

// ---------------------------------------------------------------------------
// 0x19 — EIP-191 signed data: 0x19 <1-byte version> <version data> <data>
// (EIP-191, "Specification" and "Registry of version bytes")
// ---------------------------------------------------------------------------

function decode191(
  bytes: Uint8Array,
  typedData: SignRequest['typedData'],
  hash: Hex,
  preimage: Hex,
): CheckResult {
  if (bytes.length < 2) throw new RlpError('EIP-191 payload too short for a version byte');
  const version = bytes[1]!;

  if (version === 0x00) {
    // 0x19 0x00 <20-byte intended validator> <data to sign>
    if (bytes.length < 22) throw new RlpError('version 0x00 payload too short for a validator address');
    const validator = getAddress(bytesToHex(bytes.slice(2, 22)));
    const data = bytes.slice(22);
    return result(
      'ALLOW_WITH_CONFIRMATION',
      'eip191-v0',
      `EIP-191 v0: signs ${data.length} byte(s) of data bound to validator ${validator}`,
      [
        { label: 'version', value: '0x00 (data with intended validator)' },
        { label: 'validator', value: validator },
        { label: 'data', value: bytesToHex(data) },
      ],
      [],
      'The signature is bound to one validator contract. Confirm the validator is expected.',
      hash,
      preimage,
    );
  }

  if (version === 0x01) {
    // 0x19 0x01 <32-byte domainSeparator> <32-byte hashStruct(message)>  (EIP-712)
    if (bytes.length !== 66) throw new RlpError(`version 0x01 payload must be 66 bytes, got ${bytes.length}`);
    if (!typedData) {
      return result(
        'BLOCK',
        'eip712-typed-data',
        'EIP-712 typed-data digest supplied without the typed data — only two opaque hashes are visible.',
        [
          { label: 'domainSeparator', value: bytesToHex(bytes.slice(2, 34)) },
          { label: 'hashStruct(message)', value: bytesToHex(bytes.slice(34, 66)) },
        ],
        ['Cannot show what this approves — resubmit with the EIP-712 typed data JSON so fields can be decoded and verified'],
        'An EIP-712 signature can approve permits, orders, and other high-value operations. Blocked: no typed data supplied.',
        hash,
        preimage,
      );
    }
    return render712(typedData, hash, preimage, {
      domainSeparator: bytesToHex(bytes.slice(2, 34)),
      structHash: bytesToHex(bytes.slice(34, 66)),
    });
  }

  if (version === 0x45) {
    // 0x19 0x45 "thereum Signed Message:\n" <decimal len> <message>
    const tagBytes = new TextEncoder().encode(PERSONAL_SIGN_TAG);
    for (let i = 0; i < tagBytes.length; i++) {
      if (bytes[2 + i] !== tagBytes[i]) throw new RlpError('version 0x45 payload missing the personal_sign tag');
    }
    let pos = 2 + tagBytes.length;
    let lenEnd = pos;
    while (lenEnd < bytes.length && bytes[lenEnd]! >= 0x30 && bytes[lenEnd]! <= 0x39) lenEnd++;
    if (lenEnd === pos) throw new RlpError('version 0x45 payload missing the decimal message length');
    const declaredLen = parseInt(new TextDecoder().decode(bytes.slice(pos, lenEnd)), 10);
    const message = bytes.slice(lenEnd);
    const lenOk = declaredLen === message.length;
    const printable = /^[\x20-\x7e\n\r\t]*$/.test(new TextDecoder('utf-8', { fatal: false }).decode(message));
    return result(
      'ALLOW_WITH_CONFIRMATION',
      'eip191-personal-sign',
      `EIP-191 personal_sign: signs a ${message.length}-byte message`,
      [
        { label: 'declared length', value: `${declaredLen} byte(s)${lenOk ? '' : ` — MISMATCH: actual message is ${message.length} byte(s)`}` },
        { label: 'message', value: printable ? new TextDecoder().decode(message) : `(non-UTF-8) ${bytesToHex(message)}` },
      ],
      lenOk ? [] : ['The declared length and actual message length differ — malformed or crafted payload'],
      'The message is shown in full above. Confirm it says what you expect — this signature is often used as proof of account ownership.',
      hash,
      preimage,
    );
  }

  return refuse(
    'eip191-unknown-version',
    `EIP-191 payload with unknown version byte 0x${version.toString(16).padStart(2, '0')} — only 0x00, 0x01 and 0x45 are registered`,
    hash,
  );
}

// ---------------------------------------------------------------------------
// EIP-712 rendering (digest already verified to equal `hash`)
// ---------------------------------------------------------------------------

function render712(
  typedData: NonNullable<SignRequest['typedData']>,
  hash: Hex,
  preimage?: Hex,
  parts?: { domainSeparator: Hex; structHash: Hex },
): CheckResult {
  const domain = (typedData.domain ?? {}) as Record<string, unknown>;
  const primaryType = String(typedData.primaryType);
  const message = typedData.message as Record<string, unknown>;
  const typeNames = Object.keys(typedData.types ?? {}).filter((t) => t !== 'EIP712Domain');

  const fields: Field[] = [
    { label: 'version', value: '0x01 (EIP-712 structured data) — digest recomputed and verified' },
    { label: 'domain.name', value: String(domain.name ?? '(none)') },
    { label: 'domain.version', value: String(domain.version ?? '(none)') },
    { label: 'domain.chainId', value: String(domain.chainId ?? '(none)') },
    { label: 'domain.verifyingContract', value: String(domain.verifyingContract ?? '(none)') },
    { label: 'primaryType', value: primaryType },
  ];
  for (const [k, v] of Object.entries(message)) {
    fields.push({ label: `message.${k}`, value: typeof v === 'object' ? JSON.stringify(v) : String(v) });
  }
  if (parts) {
    fields.push({ label: 'domainSeparator', value: parts.domainSeparator });
    fields.push({ label: 'hashStruct(message)', value: parts.structHash });
  }

  const warnings: string[] = [];
  const approvalPattern = /permit|approval/i;
  if (approvalPattern.test(primaryType) || typeNames.some((t) => approvalPattern.test(t))) {
    warnings.push(`APPROVAL-STYLE TYPED DATA: "${primaryType}" typically authorizes a spender/operator to move your tokens or NFTs`);
  }
  const grantKeys = Object.keys(message).filter((k) => /^(spender|operator|approved|allowance|permitted)$/i.test(k));
  if (grantKeys.length > 0 && warnings.length === 0) {
    warnings.push(`APPROVAL-STYLE TYPED DATA: message grants rights via field(s) ${grantKeys.join(', ')}`);
  }
  if (/setApprovalForAll|approvalForAll/i.test(primaryType) || /true/i.test(String(message.approved))) {
    warnings.push('GRANTS CONTROL OF EVERY TOKEN YOU HOLD IN THIS COLLECTION — not a single-item approval');
  }

  return result(
    'ALLOW_WITH_CONFIRMATION',
    'eip712-typed-data',
    `EIP-712 typed data "${primaryType}" for domain "${String(domain.name ?? '(unnamed)')}" — digest recomputed and matches`,
    fields,
    warnings,
    'Every field above is what the signature commits to. Confirm domain and fields — especially spender/operator rights — before signing.',
    hash,
    preimage,
  );
}

// ---------------------------------------------------------------------------
// 0x01–0x04 — typed transactions: <type> || rlp([...])
// (EIP-2718 envelope; field order per EIP-2930, EIP-1559, EIP-4844, EIP-7702)
// ---------------------------------------------------------------------------

function decodeTypedTx(typeByte: number, rest: Uint8Array, opts: CheckOptions, hash: Hex, preimage: Hex): CheckResult {
  const def = TX_TYPES[typeByte]!;
  const list = asList(decodeRlp(rest));
  const unsigned = list.length === def.fields.length;
  const signed = list.length === def.fields.length + 3;
  if (!unsigned && !signed) {
    throw new RlpError(`${def.name} payload must have ${def.fields.length} fields (unsigned) or ${def.fields.length + 3} (signed), got ${list.length}`);
  }
  const get = (name: string) => asBytes(list[def.fields.indexOf(name)]!);
  const chainId = bytesToBigInt(get('chainId'));
  const nonce = bytesToBigInt(get('nonce'));
  const to = addr(get('to'));
  const value = bytesToBigInt(get('value'));
  const data = get('data');
  const gasLimit = bytesToBigInt(get('gasLimit'));

  const fields: Field[] = [
    { label: 'type', value: `0x0${typeByte} — ${def.name}` },
    { label: 'chain_id', value: chainId.toString() },
    { label: 'nonce', value: nonce.toString() },
    { label: 'to', value: to },
    { label: 'value', value: `${formatEther(value)} ETH (${value} wei)` },
    { label: 'gas_limit', value: gasLimit.toString() },
  ];
  if (def.fields.includes('gasPrice')) fields.push({ label: 'gas_price', value: `${formatGwei(bytesToBigInt(get('gasPrice')))} gwei` });
  if (def.fields.includes('maxFeePerGas')) {
    fields.push({ label: 'max_fee_per_gas', value: `${formatGwei(bytesToBigInt(get('maxFeePerGas')))} gwei` });
    fields.push({ label: 'max_priority_fee_per_gas', value: `${formatGwei(bytesToBigInt(get('maxPriorityFeePerGas')))} gwei` });
  }
  if (typeByte === 0x03) fields.push({ label: 'max_fee_per_blob_gas', value: `${formatGwei(bytesToBigInt(get('maxFeePerBlobGas')))} gwei` });

  const warnings: string[] = [];
  const dataHex = bytesToHex(data);
  const call = decodeCallData(dataHex);
  fields.push({ label: 'data', value: call ? call.text : dataHex === '0x' ? '(none — plain ETH transfer)' : `${(dataHex.length - 2) / 2} bytes: ${dataHex.slice(0, 18)}…` });
  if (call) warnings.push(...call.warnings);

  if (signed) {
    const [yp, r, s] = list.slice(-3);
    fields.push(
      { label: 'signature.yParity', value: bytesToBigInt(asBytes(yp!)).toString() },
      { label: 'signature.r', value: bytesToHex(asBytes(r!)) },
      { label: 'signature.s', value: bytesToHex(asBytes(s!)) },
    );
  }

  if (typeByte === 0x04) {
    const authList = asList(list[def.fields.indexOf('authorizationList')]!);
    const blocked: string[] = [];
    authList.forEach((a, i) => {
      const items = asList(a);
      if (items.length !== 6) throw new RlpError(`authorization ${i} must have 6 fields, got ${items.length}`);
      const aChainId = bytesToBigInt(asBytes(items[0]!));
      const aDelegate = addr(asBytes(items[1]!));
      const aNonce = bytesToBigInt(asBytes(items[2]!));
      const revocation = aDelegate.toLowerCase() === ZERO_ADDRESS;
      const allowed = isAllowlisted(opts.allowlist, aDelegate, aChainId);
      fields.push({
        label: `authorization[${i}]`,
        value: `${revocation ? 'REVOCATION ' : ''}delegate ${aDelegate}, chain_id ${aChainId}, nonce ${aNonce}${allowed ? ' (allowlisted)' : ''}`,
      });
      if (aChainId === 0n) warnings.push(`authorization[${i}]: chain_id 0 — valid on EVERY chain`);
      if (!allowed) blocked.push(`authorization[${i}]`);
    });
    if (authList.length === 0) warnings.push('authorization_list is EMPTY — invalid per EIP-7702 (a set-code transaction must carry at least one authorization)');
    if (blocked.length > 0) {
      return result(
        'BLOCK',
        'eip7702-set-code-tx',
        `EIP-7702 set-code transaction carrying ${authList.length} authorization(s)`,
        fields,
        warnings,
        `A set-code transaction commits ${authList.length} delegation(s) that hand accounts' execution to contracts — the same grant as a raw 0x05 authorization. Blocked: ${blocked.join(', ')} not allowlisted.`,
        hash,
        preimage,
      );
    }
  }

  return result(
    'ALLOW_WITH_CONFIRMATION',
    `typed-transaction-0x0${typeByte}`,
    `${def.name} to ${to} for ${formatEther(value)} ETH on chain ${chainId}`,
    fields,
    warnings,
    'A normal transaction. Confirm recipient, value, and calldata before signing.',
    hash,
    preimage,
  );
}

// ---------------------------------------------------------------------------
// >= 0xc0 — legacy transaction: rlp([nonce, gasPrice, gasLimit, to, value, data])
// unsigned (6 fields) or signed (+v, r, s = 9 fields) per Yellow Paper.
// ---------------------------------------------------------------------------

function decodeLegacyTx(bytes: Uint8Array, hash: Hex, preimage: Hex): CheckResult {
  const list = asList(decodeRlp(bytes));
  if (list.length !== 6 && list.length !== 9) {
    throw new RlpError(`legacy transaction must have 6 fields (unsigned) or 9 (signed), got ${list.length}`);
  }
  const names = ['nonce', 'gasPrice', 'gasLimit', 'to', 'value', 'data'];
  const get = (i: number) => asBytes(list[i]!);
  const nonce = bytesToBigInt(get(0));
  const gasPrice = bytesToBigInt(get(1));
  const gasLimit = bytesToBigInt(get(2));
  const to = addr(get(3));
  const value = bytesToBigInt(get(4));
  const data = bytesToHex(get(5));

  const fields: Field[] = [
    { label: 'type', value: 'legacy (pre-EIP-2718)' },
    { label: 'nonce', value: nonce.toString() },
    { label: 'to', value: to },
    { label: 'value', value: `${formatEther(value)} ETH (${value} wei)` },
    { label: 'gas_limit', value: gasLimit.toString() },
    { label: 'gas_price', value: `${formatGwei(gasPrice)} gwei` },
  ];
  const warnings: string[] = [];
  const call = decodeCallData(data);
  fields.push({ label: 'data', value: call ? call.text : data === '0x' ? '(none — plain ETH transfer)' : `${(data.length - 2) / 2} bytes` });
  if (call) warnings.push(...call.warnings);
  if (list.length === 9) {
    const v = bytesToBigInt(get(6));
    fields.push({ label: 'signature.v', value: v.toString() });
    if (v >= 35n) fields.push({ label: 'chain_id (EIP-155)', value: ((v - 35n) / 2n).toString() });
  }

  return result(
    'ALLOW_WITH_CONFIRMATION',
    'legacy-transaction',
    `legacy transaction to ${to} for ${formatEther(value)} ETH`,
    fields,
    warnings,
    'A normal transaction. Confirm recipient, value, and calldata before signing.',
    hash,
    preimage,
  );
}
