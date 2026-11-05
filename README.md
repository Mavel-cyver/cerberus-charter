# Cerberus Charter attestation builder

Builds one EAS attestation payload that puts the Founding Charter, the Constitution and the SOUL on chain. The module is pure: no network and no keys. The caller passes the texts, their IPFS ids, a version and a date.

## API

    buildAttestation({ texts, cids, version, date }) -> { schema, data, digests }

- `texts`: `{ charter, constitution, soul }`, the full text of each document.
- `cids`: `{ charter, constitution, soul }`, the IPFS content id of each document.
- `version`: `1.0.0` style.
- `date`: `YYYY-MM-DD`, a real calendar date, read as UTC.

`digests` holds the sha256 hex of each text (lowercase, no prefix). `data` holds the same digests as bytes32 values with a `0x` prefix, the date as Unix seconds, and the cids. `schema` is the stable schema string:

    string version,uint64 date,bytes32 charterDigest,bytes32 constitutionDigest,bytes32 soulDigest,string charterCid,string constitutionCid,string soulCid

## Tests

    npm install
    npm test

Eleven tests cover the digests, the data, the stable schema, a changed text, missing texts and cids, a bad version, bad dates, and the ABI encoding. Coverage is 100% of lines and functions and more than 96% of branches; the uncovered branch is the negative-value guard in `word()` in abi.ts, which the public entry point cannot reach because the date is validated before encoding.

## Scope

The payload is built and ABI encoded here (`encoded`, bytes for EAS). Licence: MIT (see LICENSE). Making the attestation on chain is a separate step and needs its own signer.
