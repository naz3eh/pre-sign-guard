export type Verdict = 'ALLOW_WITH_CONFIRMATION' | 'BLOCK' | 'REFUSE';

export interface Field {
  label: string;
  value: string;
}

export interface CheckResult {
  verdict: Verdict;
  /** Machine-readable payload kind, e.g. 'eip7702-authorization'. */
  kind: string;
  /** One-line plain-English statement of what the signature does. */
  title: string;
  /** Display rows for the human confirming the request. */
  fields: Field[];
  /** Loud flags shown above the verdict. */
  warnings: string[];
  /** Why the verdict was chosen. */
  reason: string;
  /** The digest being signed over, when known. */
  hash?: `0x${string}`;
  /** The decoded preimage, when known. */
  preimage?: `0x${string}`;
}

/** One allowlist entry: a delegate address the signer has explicitly opted into, on one chain. */
export interface AllowEntry {
  delegate: `0x${string}`;
  chainId: number;
}

export interface CheckOptions {
  allowlist?: AllowEntry[];
}

/** What a caller asks the guard to evaluate. */
export interface SignRequest {
  /** The 32-byte digest the signer is asked to sign. */
  hash?: `0x${string}`;
  /** The preimage the digest is claimed to hash. */
  preimage?: `0x${string}`;
  /** EIP-712 typed data JSON (eth_signTypedData shape). */
  typedData?: {
    types: Record<string, { name: string; type: string }[]>;
    primaryType: string;
    domain?: Record<string, unknown>;
    message: Record<string, unknown>;
  };
}
