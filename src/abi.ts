// Known-function decoding for transaction calldata.
// Selectors verified against the canonical 4-byte signatures.

import { decodeFunctionData, parseAbi, type Hex } from 'viem';

const KNOWN_ABI = parseAbi([
  'function transfer(address to, uint256 amount)',
  'function transferFrom(address from, address to, uint256 amount)',
  'function approve(address spender, uint256 amount)',
  'function setApprovalForAll(address operator, bool approved)',
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'function deposit()',
  'function withdraw(uint256 amount)',
  'function multicall(bytes[] data)',
  'function execute(address to, uint256 value, bytes data)',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
]);

const MAX_UINT256 = (1n << 256n) - 1n;

export interface DecodedCall {
  selector: string;
  text: string;
  warnings: string[];
}

/** Decode transaction calldata against a small known ABI. Returns null for empty calldata. */
export function decodeCallData(data: Hex): DecodedCall | null {
  if (data === '0x' || data.length < 10) return null;
  const selector = data.slice(0, 10);
  const warnings: string[] = [];
  try {
    const { functionName, args } = decodeFunctionData({ abi: KNOWN_ABI, data });
    const a = [...(args ?? [])] as unknown[];
    let text = `${functionName}(${a.map(formatArg).join(', ')})`;
    switch (functionName) {
      case 'approve': {
        const amount = a[1] as bigint;
        warnings.push(
          amount === MAX_UINT256 || amount > (1n << 200n)
            ? 'TOKEN APPROVAL: grants the spender effectively UNLIMITED withdrawal rights over your tokens'
            : 'TOKEN APPROVAL: grants the spender withdrawal rights over your tokens',
        );
        break;
      }
      case 'setApprovalForAll': {
        const approved = a[1] as boolean;
        if (approved) {
          warnings.push(
            'GRANTS OPERATOR CONTROL OF EVERY NFT YOU HOLD IN THIS COLLECTION — a full hand-over, not a single-item action',
          );
        } else {
          text += ' (revokes operator control)';
        }
        break;
      }
      case 'transfer':
      case 'transferFrom': {
        text += ' — amount is in the token’s smallest unit (decimals not shown)';
        break;
      }
      case 'permit': {
        warnings.push('OFF-CHAIN TOKEN PERMIT: this signature authorizes the spender to move your tokens');
        break;
      }
      default:
        break;
    }
    return { selector, text, warnings };
  } catch {
    return { selector, text: `unknown selector ${selector} (${byteLen(data)} bytes of calldata)`, warnings };
  }
}

function formatArg(arg: unknown): string {
  if (typeof arg === 'bigint') return arg.toString();
  if (Array.isArray(arg)) return `[${arg.map(formatArg).join(', ')}]`;
  return String(arg);
}

function byteLen(hex: string): number {
  return (hex.length - 2) / 2;
}
