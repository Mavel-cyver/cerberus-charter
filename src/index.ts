import { createHash } from 'node:crypto';
import { DOCUMENT_KEYS, type Attestation, type AttestationInput, type DocumentKey } from './types.ts';

export type { Attestation, AttestationData, AttestationInput, DocumentKey } from './types.ts';

/** Schema string of the attestation. Changing it changes the attestation type, so keep it stable. */
export const SCHEMA =
  'string version,uint64 date,bytes32 charterDigest,bytes32 constitutionDigest,bytes32 soulDigest,string charterCid,string constitutionCid,string soulCid';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} is required`);
  }
  return value;
}

function parseDate(value: string): number {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new Error('date must be YYYY-MM-DD');
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error('date is not a real calendar date');
  }
  return ms / 1000;
}

/**
 * Builds the EAS attestation payload for the Charter, the Constitution and the SOUL.
 * Pure: no network, no keys. Throws on any missing text or cid, a bad version, or a bad date.
 */
export function buildAttestation(input: AttestationInput): Attestation {
  const digests = {} as Record<DocumentKey, string>;
  const cids = {} as Record<DocumentKey, string>;
  for (const key of DOCUMENT_KEYS) {
    digests[key] = sha256Hex(requireText(input.texts?.[key], key));
    cids[key] = requireText(input.cids?.[key], `${key} cid`);
  }

  const version = requireText(input.version, 'version');
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('version must look like 1.0.0');

  const date = parseDate(input.date);

  return {
    schema: SCHEMA,
    data: {
      version,
      date,
      charterDigest: '0x' + digests.charter,
      constitutionDigest: '0x' + digests.constitution,
      soulDigest: '0x' + digests.soul,
      charterCid: cids.charter,
      constitutionCid: cids.constitution,
      soulCid: cids.soul,
    },
    digests,
  };
}
