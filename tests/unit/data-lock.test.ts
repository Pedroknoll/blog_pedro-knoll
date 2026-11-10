import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { checkDataDir, findDataDirs, sha256Hex } from "../../src/lib/data-lock";

const dataDir = "src/content/posts/2026-10-como-o-blog-e-feito/data";
const postB = "src/content/posts/2026-10-como-o-blog-e-feito";
const outro = "src/content/posts/2026-10-outro";

const scriptPath = "scripts/build-data.py";
const generatorLockPath = "scripts/build-data.py.lock";
const tokensPath = `${dataDir}/raw/tokens.json`;
const attentionPath = `${dataDir}/attention.json`;
const lockPath = `${dataDir}/data.lock`;

const scriptBytes = new TextEncoder().encode("script\n");
const rawBytes = new TextEncoder().encode("raw\n");
const outBytes = new TextEncoder().encode("out\n");

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

const scriptHash = sha256(scriptBytes);
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
    format: 1,
    generator: scriptPath,
    python: "3.14.x",
    inputs: {
      [scriptPath]: scriptHash,
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
    [scriptPath, scriptBytes],
    [tokensPath, rawBytes],
    [attentionPath, outBytes],
    [lockPath, lockBytes(lock)],
  ] as const;
}

const freshFiles = [lockPath, tokensPath, attentionPath];

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

  it("lock-invalid", () => {
    const lock = freshLock();
    lock.format = 2;
    expect(
      checkDataDir(dataDir, freshFiles, readFrom(freshEntries(lock))),
    ).toEqual([{ file: lockPath, reason: "lock-invalid" }]);
  });

  it("generator-missing", () => {
    const lock = freshLock();
    lock.inputs = { [tokensPath]: rawHash };
    expect(
      checkDataDir(dataDir, freshFiles, readFrom(freshEntries(lock))),
    ).toEqual([{ file: scriptPath, reason: "generator-missing" }]);
  });

  it("generator-lock-missing", () => {
    expect(
      checkDataDir(
        dataDir,
        freshFiles,
        readFrom([
          ...freshEntries(),
          [generatorLockPath, new TextEncoder().encode("lock\n")],
        ]),
      ),
    ).toEqual([{ file: generatorLockPath, reason: "generator-lock-missing" }]);
  });

  it("outside", () => {
    const readmePath = "README.md";
    const vazadoPath = `${dataDir}/raw/vazado.json`;
    const readmeBytes = new TextEncoder().encode("readme\n");
    const vazadoBytes = new TextEncoder().encode("vazado\n");
    const lock = freshLock();
    lock.inputs = {
      ...lock.inputs,
      [readmePath]: sha256(readmeBytes),
    };
    lock.outputs = {
      ...lock.outputs,
      [vazadoPath]: sha256(vazadoBytes),
    };
    expect(
      checkDataDir(
        dataDir,
        [...freshFiles, vazadoPath],
        readFrom([
          ...freshEntries(lock),
          [readmePath, readmeBytes],
          [vazadoPath, vazadoBytes],
        ]),
      ),
    ).toEqual([
      { file: readmePath, reason: "outside" },
      { file: vazadoPath, reason: "outside" },
    ]);
  });

  it("no-outputs", () => {
    const lock = freshLock();
    lock.outputs = {};
    expect(
      checkDataDir(
        dataDir,
        [lockPath, tokensPath],
        readFrom([
          [scriptPath, scriptBytes],
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
        [lockPath, tokensPath],
        readFrom([
          [scriptPath, scriptBytes],
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
      [scriptPath]: bad,
      [tokensPath]: bad,
    };
    lock.outputs = {
      [attentionPath]: bad,
    };
    expect(
      checkDataDir(dataDir, freshFiles, readFrom(freshEntries(lock))),
    ).toEqual([
      { file: scriptPath, reason: "hash-mismatch" },
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
