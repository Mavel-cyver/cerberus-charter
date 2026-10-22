import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildAttestation, type AttestationInput } from '../src/index.ts';

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
