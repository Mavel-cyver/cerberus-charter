import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildAttestation, encodeAttestation, type AttestationInput } from '../src/index.ts';

const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

const INPUT: AttestationInput = {
  texts: { charter: 'Charter text', constitution: 'Constitution text', soul: 'SOUL text' },
  cids: { charter: 'bafyCharter', constitution: 'bafyConstitution', soul: 'bafySoul' },
  version: '1.0.0',
  date: '2026-11-14',
};

test('digests are the sha256 of each text', () => {
  const r = buildAttestation(INPUT);
  assert.equal(r.digests.charter, sha('Charter text'));
  assert.equal(r.digests.constitution, sha('Constitution text'));
  assert.equal(r.digests.soul, sha('SOUL text'));
});

test('data carries the digests, cids, version and the UTC date in seconds', () => {
  const r = buildAttestation(INPUT);
  assert.equal(r.data.version, '1.0.0');
  assert.equal(r.data.date, Date.UTC(2026, 10, 14) / 1000);
  assert.equal(r.data.charterDigest, '0x' + sha('Charter text'));
  assert.equal(r.data.constitutionDigest, '0x' + sha('Constitution text'));
  assert.equal(r.data.soulDigest, '0x' + sha('SOUL text'));
  assert.equal(r.data.charterCid, 'bafyCharter');
  assert.equal(r.data.constitutionCid, 'bafyConstitution');
  assert.equal(r.data.soulCid, 'bafySoul');
});

test('schema string is stable and names every field in order', () => {
  const expected =
    'string version,uint64 date,bytes32 charterDigest,bytes32 constitutionDigest,bytes32 soulDigest,string charterCid,string constitutionCid,string soulCid';
  assert.equal(buildAttestation(INPUT).schema, expected);
  assert.equal(buildAttestation({ ...INPUT, version: '2.0.0' }).schema, expected);
});

test('a changed text changes its digest and the data', () => {
  const a = buildAttestation(INPUT);
  const b = buildAttestation({ ...INPUT, texts: { ...INPUT.texts, soul: 'SOUL text, edited' } });
  assert.notEqual(b.digests.soul, a.digests.soul);
  assert.notEqual(b.data.soulDigest, a.data.soulDigest);
  assert.equal(b.digests.charter, a.digests.charter);
});

test('rejects a missing or empty text', () => {
  assert.throws(() => buildAttestation({ ...INPUT, texts: { ...INPUT.texts, charter: '' } }), /charter/);
  assert.throws(
    () => buildAttestation({ ...INPUT, texts: { charter: 'x', soul: 'y' } as AttestationInput['texts'] }),
    /constitution/,
  );
});

test('rejects a missing cid', () => {
  assert.throws(() => buildAttestation({ ...INPUT, cids: { ...INPUT.cids, soul: '' } }), /soul/);
});

test('rejects a bad version', () => {
  assert.throws(() => buildAttestation({ ...INPUT, version: 'one' }), /version/);
});

test('rejects a bad date', () => {
  assert.throws(() => buildAttestation({ ...INPUT, date: '14.11.2026' }), /date/);
  assert.throws(() => buildAttestation({ ...INPUT, date: '2026-02-30' }), /date/);
});

// Reference vector from eth_abi (Python) for the schema, with the values below.
const REFERENCE_ENCODED = '0x0000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000006af7a4801111111111111111111111111111111111111111111111111111111111111111222222222222222222222222222222222222222222222222222222222222222233333333333333333333333333333333333333333333333333333333333333330000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000005312e302e30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b6261667943686172746572000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001062616679436f6e737469747574696f6e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000862616679536f756c000000000000000000000000000000000000000000000000';

test('encoded matches the reference ABI encoding of the schema', () => {
  const r = encodeAttestation({
    version: '1.0.0',
    date: 1794614400,
    charterDigest: '0x' + '11'.repeat(32),
    constitutionDigest: '0x' + '22'.repeat(32),
    soulDigest: '0x' + '33'.repeat(32),
    charterCid: 'bafyCharter',
    constitutionCid: 'bafyConstitution',
    soulCid: 'bafySoul',
  });
  assert.equal(r, REFERENCE_ENCODED);
});

test('encoded changes when a text changes', () => {
  const a = buildAttestation(INPUT).encoded;
  const b = buildAttestation({ ...INPUT, texts: { ...INPUT.texts, soul: 'SOUL text!' } }).encoded;
  assert.notEqual(a, b);
});
