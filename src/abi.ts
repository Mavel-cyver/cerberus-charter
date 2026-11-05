import type { AttestationData } from './types.ts';

const WORD = 32;

function word(value: bigint): string {
  if (value < 0n) throw new Error('negative value cannot be encoded');
  return value.toString(16).padStart(64, '0');
}

function bytes32(hex: string): string {
  if (!/^0x[0-9a-f]{64}$/.test(hex)) throw new Error('bytes32 must be 0x + 64 lowercase hex digits');
  return hex.slice(2);
}

function encodeString(text: string): string {
  const raw = Buffer.from(text, 'utf8');
  const padded = Math.ceil(raw.length / WORD) * WORD;
  return word(BigInt(raw.length)) + raw.toString('hex').padEnd(padded * 2, '0');
}

/**
 * ABI encodes the attestation data for the schema
 * `string version,uint64 date,bytes32 charterDigest,bytes32 constitutionDigest,bytes32 soulDigest,string charterCid,string constitutionCid,string soulCid`
 * as the standard Solidity tuple encoding (head with offsets, then tails). Returns 0x-prefixed hex.
 */
export function encodeAttestation(d: AttestationData): string {
  if (!Number.isSafeInteger(d.date) || d.date < 0) throw new Error('date must be a non-negative integer');
  const dynamic = [d.version, d.charterCid, d.constitutionCid, d.soulCid].map(encodeString);
  const headSize = 8 * WORD;
  const offsets = [0];
  for (let i = 0; i < dynamic.length - 1; i++) {
    offsets.push(offsets[i] + dynamic[i].length / 2);
  }
  const head = [
    word(BigInt(headSize + offsets[0])),
    word(BigInt(d.date)),
    bytes32(d.charterDigest),
    bytes32(d.constitutionDigest),
    bytes32(d.soulDigest),
    word(BigInt(headSize + offsets[1])),
    word(BigInt(headSize + offsets[2])),
    word(BigInt(headSize + offsets[3])),
  ];
  return '0x' + head.join('') + dynamic.join('');
}
