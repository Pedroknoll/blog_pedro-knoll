import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { checkDataDir, findDataDirs, sha256Hex } from "../../src/lib/data-lock";

const dataDir = "src/content/posts/2026-10-como-o-blog-e-feito/data";
const postB = "src/content/posts/2026-10-como-o-blog-e-feito";
const outro = "src/content/posts/2026-10-outro";

const buildPath = `${dataDir}/build.py`;
const buildLockPath = `${dataDir}/build.py.lock`;
const tokensPath = `${dataDir}/raw/tokens.json`;
const attentionPath = `${dataDir}/attention.json`;
const lockPath = `${dataDir}/data.lock`;

const buildBytes = new TextEncoder().encode("script\n");
const rawBytes = new TextEncoder().encode("raw\n");
const outBytes = new TextEncoder().encode("out\n");

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

const buildHash = sha256(buildBytes);
const rawHash = sha256(rawBytes);
const outHash = sha256(outBytes);

type LockFile = {
  format: number;
  generator: string;
  python: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
};

function freshLock(): LockFile {
  return {
    format: 2,
    generator: buildPath,
    python: "3.14.x",
    inputs: {
      [buildPath]: buildHash,
      [tokensPath]: rawHash,
    },
    outputs: {
      [attentionPath]: outHash,
    },
  };
}

function lockBytes(lock: LockFile): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(lock));
}

function readFrom(entries: Iterable<readonly [string, Uint8Array]>) {
  const files = new Map(entries);
  return (path: string) => files.get(path);
}

function freshEntries(lock: LockFile = freshLock()) {
  return [
    [buildPath, buildBytes],
    [tokensPath, rawBytes],
    [attentionPath, outBytes],
    [lockPath, lockBytes(lock)],
  ] as const;
}

const freshFiles = [lockPath, buildPath, tokensPath, attentionPath];

describe("data-lock", () => {
  it('sha256Hex("abc") é o vetor conhecido', () => {
    expect(sha256Hex(new Uint8Array([0x61, 0x62, 0x63]))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("findDataDirs casa a pasta do post", () => {
    const repeated = `${postB}/data/raw/x.json`;
    expect(
      findDataDirs([
        `${outro}/data/saida.json`,
        `${postB}/index.mdx`,
        `${postB}/figs/figura.svg`,
        `${postB}/data/attention.json`,
        repeated,
        repeated,
        `${outro}/figs/data/a.svg`,
      ]),
    ).toEqual([`${postB}/data`, `${outro}/data`]);
  });

  it("lock fresco devolve []", () => {
    expect(checkDataDir(dataDir, freshFiles, readFrom(freshEntries()))).toEqual(
      [],
    );
  });

  it("lock-missing", () => {
    expect(
      checkDataDir(dataDir, [tokensPath], readFrom([[tokensPath, rawBytes]])),
    ).toEqual([{ file: lockPath, reason: "lock-missing" }]);
  });

  it("generator scripts/build-data.py é lock-invalid", () => {
    const lock = freshLock();
    lock.generator = "scripts/build-data.py";
    expect(
      checkDataDir(dataDir, freshFiles, readFrom(freshEntries(lock))),
    ).toEqual([{ file: lockPath, reason: "lock-invalid" }]);
  });

  it("format 1 é lock-invalid", () => {
    const lock = freshLock();
    lock.format = 1;
    expect(
      checkDataDir(dataDir, freshFiles, readFrom(freshEntries(lock))),
    ).toEqual([{ file: lockPath, reason: "lock-invalid" }]);
  });

  it("generator-missing", () => {
    const lock = freshLock();
    lock.inputs = { [tokensPath]: rawHash };
    expect(
      checkDataDir(dataDir, freshFiles, readFrom(freshEntries(lock))),
    ).toEqual([
      { file: buildPath, reason: "generator-missing" },
      { file: buildPath, reason: "unlisted" },
    ]);
  });

  it("build.py.lock nas entradas é aceito", () => {
    const buildLockBytes = new TextEncoder().encode("lock\n");
    const lock = freshLock();
    lock.inputs = {
      ...lock.inputs,
      [buildLockPath]: sha256(buildLockBytes),
    };
    expect(
      checkDataDir(
        dataDir,
        [...freshFiles, buildLockPath],
        readFrom([...freshEntries(lock), [buildLockPath, buildLockBytes]]),
      ),
    ).toEqual([]);
  });

  it("generator-lock-missing", () => {
    const buildLockBytes = new TextEncoder().encode("lock\n");
    expect(
      checkDataDir(
        dataDir,
        [...freshFiles, buildLockPath],
        readFrom([...freshEntries(), [buildLockPath, buildLockBytes]]),
      ),
    ).toEqual([
      { file: buildLockPath, reason: "generator-lock-missing" },
      { file: buildLockPath, reason: "unlisted" },
    ]);
  });

  it("outside", () => {
    const readmePath = "README.md";
    const scriptPath = "scripts/build-data.py";
    const leakedPath = `${dataDir}/raw/vazado.json`;
    const readmeBytes = new TextEncoder().encode("readme\n");
    const scriptBytes = new TextEncoder().encode("script\n");
    const leakedBytes = new TextEncoder().encode("vazado\n");
    const lock = freshLock();
    lock.inputs = {
      ...lock.inputs,
      [readmePath]: sha256(readmeBytes),
      [scriptPath]: sha256(scriptBytes),
    };
    lock.outputs = {
      ...lock.outputs,
      [buildPath]: buildHash,
      [leakedPath]: sha256(leakedBytes),
    };
    expect(
      checkDataDir(
        dataDir,
        [...freshFiles, leakedPath],
        readFrom([
          ...freshEntries(lock),
          [readmePath, readmeBytes],
          [scriptPath, scriptBytes],
          [leakedPath, leakedBytes],
        ]),
      ),
    ).toEqual([
      { file: readmePath, reason: "outside" },
      { file: scriptPath, reason: "outside" },
      { file: buildPath, reason: "outside" },
      { file: leakedPath, reason: "outside" },
    ]);
  });

  it("no-outputs", () => {
    const lock = freshLock();
    lock.outputs = {};
    expect(
      checkDataDir(
        dataDir,
        [lockPath, buildPath, tokensPath],
        readFrom([
          [buildPath, buildBytes],
          [tokensPath, rawBytes],
          [lockPath, lockBytes(lock)],
        ]),
      ),
    ).toEqual([{ file: lockPath, reason: "no-outputs" }]);
  });

  it("file-missing", () => {
    expect(
      checkDataDir(
        dataDir,
        [lockPath, buildPath, tokensPath],
        readFrom([
          [buildPath, buildBytes],
          [tokensPath, rawBytes],
          [lockPath, lockBytes(freshLock())],
        ]),
      ),
    ).toEqual([{ file: attentionPath, reason: "file-missing" }]);
  });

  it("hash-mismatch", () => {
    const bad = "ab".repeat(32);
    const lock = freshLock();
    lock.inputs = {
      [buildPath]: bad,
      [tokensPath]: bad,
    };
    lock.outputs = {
      [attentionPath]: bad,
    };
    expect(
      checkDataDir(dataDir, freshFiles, readFrom(freshEntries(lock))),
    ).toEqual([
      { file: buildPath, reason: "hash-mismatch" },
      { file: tokensPath, reason: "hash-mismatch" },
      { file: attentionPath, reason: "hash-mismatch" },
    ]);
  });

  it("unlisted", () => {
    const extraPath = `${dataDir}/extra.json`;
    expect(
      checkDataDir(
        dataDir,
        [...freshFiles, extraPath],
        readFrom([
          ...freshEntries(),
          [extraPath, new TextEncoder().encode("extra\n")],
        ]),
      ),
    ).toEqual([{ file: extraPath, reason: "unlisted" }]);
  });
});
