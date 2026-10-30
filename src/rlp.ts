// Minimal RLP decoder per the Ethereum Yellow Paper, Appendix B.
// Produces a tree of Uint8Array leaves and nested lists.

export type RlpItem = Uint8Array | RlpItem[];

export class RlpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RlpError';
  }
}

function decodeAt(bytes: Uint8Array, offset: number): { item: RlpItem; next: number } {
  if (offset >= bytes.length) throw new RlpError('unexpected end of input');
  const b0 = bytes[offset]!;

  if (b0 <= 0x7f) {
    return { item: bytes.slice(offset, offset + 1), next: offset + 1 };
  }
  if (b0 <= 0xb7) {
    const len = b0 - 0x80;
    if (offset + 1 + len > bytes.length) throw new RlpError('short string overruns input');
    return { item: bytes.slice(offset + 1, offset + 1 + len), next: offset + 1 + len };
  }
  if (b0 <= 0xbf) {
    const lenOfLen = b0 - 0xb7;
    if (offset + 1 + lenOfLen > bytes.length) throw new RlpError('long string length overruns input');
    const len = readLength(bytes, offset + 1, lenOfLen);
    const start = offset + 1 + lenOfLen;
    if (start + len > bytes.length) throw new RlpError('long string overruns input');
    return { item: bytes.slice(start, start + len), next: start + len };
  }
  if (b0 <= 0xf7) {
    const len = b0 - 0xc0;
    return decodeList(bytes, offset + 1, offset + 1 + len);
  }
  const lenOfLen = b0 - 0xf7;
  if (offset + 1 + lenOfLen > bytes.length) throw new RlpError('long list length overruns input');
  const len = readLength(bytes, offset + 1, lenOfLen);
  return decodeList(bytes, offset + 1 + lenOfLen, offset + 1 + lenOfLen + len);
}

function readLength(bytes: Uint8Array, offset: number, lenOfLen: number): number {
  if (lenOfLen > 8) throw new RlpError('length-of-length too large');
  let len = 0;
  for (let i = 0; i < lenOfLen; i++) len = len * 256 + bytes[offset + i]!;
  return len;
}

function decodeList(bytes: Uint8Array, start: number, end: number): { item: RlpItem; next: number } {
  if (end > bytes.length) throw new RlpError('list overruns input');
  const items: RlpItem[] = [];
  let pos = start;
  while (pos < end) {
    const { item, next } = decodeAt(bytes, pos);
    if (next <= pos) throw new RlpError('decoder made no progress');
    items.push(item);
    pos = next;
  }
  if (pos !== end) throw new RlpError('list content length mismatch');
  return { item: items, next: end };
}

/** Decode an RLP value that must consume the entire input. */
export function decodeRlp(bytes: Uint8Array): RlpItem {
  const { item, next } = decodeAt(bytes, 0);
  if (next !== bytes.length) throw new RlpError('trailing bytes after RLP value');
  return item;
}

/** Encode a tree of bytes/lists as RLP. Minimal-length integer and length encoding per the spec. */
export function encodeRlp(item: RlpItem): Uint8Array {
  if (item instanceof Uint8Array) return encodeString(item);
  const payload = concatBytes(item.map(encodeRlp));
  return concatBytes([encodeLength(0xc0, payload.length), payload]);
}

function encodeString(b: Uint8Array): Uint8Array {
  if (b.length === 1 && b[0]! < 0x80) return b;
  return concatBytes([encodeLength(0x80, b.length), b]);
}

function encodeLength(offset: number, len: number): Uint8Array {
  if (len < 56) return Uint8Array.of(offset + len);
  const lenBytes = bigIntToBytes(BigInt(len));
  return concatBytes([Uint8Array.of(offset + 55 + lenBytes.length), lenBytes]);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

export function bigIntToBytes(v: bigint): Uint8Array {
  if (v === 0n) return new Uint8Array(0);
  let hex = v.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}
