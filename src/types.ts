export type DocumentKey = 'charter' | 'constitution' | 'soul';

export const DOCUMENT_KEYS: readonly DocumentKey[] = ['charter', 'constitution', 'soul'];

export interface AttestationInput {
  /** Full text of each document, keyed by document. */
  texts: Record<DocumentKey, string>;
  /** IPFS content id of each document, keyed by document. */
  cids: Record<DocumentKey, string>;
  /** Version label, for example "1.0.0". */
  version: string;
  /** Date of the attestation as YYYY-MM-DD (UTC). */
  date: string;
}

export interface AttestationData {
  version: string;
  date: number;
  charterDigest: string;
  constitutionDigest: string;
  soulDigest: string;
  charterCid: string;
  constitutionCid: string;
  soulCid: string;
}

export interface Attestation {
  schema: string;
  data: AttestationData;
  /** sha256 hex of each text (lowercase, no 0x prefix), keyed by document. */
  digests: Record<DocumentKey, string>;
}
