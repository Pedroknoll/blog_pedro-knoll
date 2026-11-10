import { createHash } from "node:crypto";

export type DataReason =
  | "lock-missing"
  | "lock-invalid"
  | "generator-missing"
  | "generator-lock-missing"
  | "outside"
  | "no-outputs"
  | "file-missing"
  | "hash-mismatch"
  | "unlisted";

export type DataProblem = { file: string; reason: DataReason };

const postsPrefix = "src/content/posts/";
const generatorPath = "scripts/build-data.py";
const generatorLockPath = "scripts/build-data.py.lock";
const hashPattern = /^[0-9a-f]{64}$/;

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function findDataDirs(paths: readonly string[]): string[] {
  const dirs = new Set<string>();
  for (const file of paths) {
    if (!file.startsWith(postsPrefix)) continue;
    const segments = file.slice(postsPrefix.length).split("/");
    if (segments.length < 3 || segments[0] === "" || segments[1] !== "data") {
      continue;
    }
    dirs.add(`${postsPrefix}${segments[0]}/data`);
  }
  return [...dirs].sort();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isHashMap(value: unknown): value is Record<string, string> {
  if (!isPlainObject(value)) return false;
  return Object.values(value).every(
    (item) => typeof item === "string" && hashPattern.test(item),
  );
}

function lockInvalid(lockPath: string): DataProblem[] {
  return [{ file: lockPath, reason: "lock-invalid" }];
}

function underRaw(dataDir: string, file: string): boolean {
  return file.startsWith(`${dataDir}/raw/`);
}

function inputOutside(dataDir: string, file: string): boolean {
  if (file === generatorPath || file === generatorLockPath) return false;
  return !underRaw(dataDir, file);
}

function outputOutside(dataDir: string, file: string): boolean {
  if (!file.startsWith(`${dataDir}/`)) return true;
  if (underRaw(dataDir, file)) return true;
  return file === `${dataDir}/data.lock`;
}

function parseLock(bytes: Uint8Array):
  | {
      inputs: Record<string, string>;
      outputs: Record<string, string>;
    }
  | undefined {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return undefined;
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return undefined;
  }

  if (
    !isPlainObject(value) ||
    !("format" in value) ||
    !("generator" in value) ||
    !("python" in value) ||
    !("inputs" in value) ||
    !("outputs" in value) ||
    value.format !== 1 ||
    typeof value.generator !== "string" ||
    typeof value.python !== "string" ||
    !isHashMap(value.inputs) ||
    !isHashMap(value.outputs)
  ) {
    return undefined;
  }

  return { inputs: value.inputs, outputs: value.outputs };
}

export function checkDataDir(
  dataDir: string,
  dataFiles: readonly string[],
  read: (path: string) => Uint8Array | undefined,
): DataProblem[] {
  const lockPath = `${dataDir}/data.lock`;
  if (!dataFiles.includes(lockPath)) {
    if (dataFiles.length === 0) return [];
    return [{ file: lockPath, reason: "lock-missing" }];
  }

  const lockBytes = read(lockPath);
  if (lockBytes === undefined) return lockInvalid(lockPath);
  const lock = parseLock(lockBytes);
  if (lock === undefined) return lockInvalid(lockPath);

  const inputKeys = Object.keys(lock.inputs).sort();
  const outputKeys = Object.keys(lock.outputs).sort();
  const problems: DataProblem[] = [];

  if (!Object.hasOwn(lock.inputs, generatorPath)) {
    problems.push({ file: generatorPath, reason: "generator-missing" });
  }

  if (
    read(generatorLockPath) !== undefined &&
    !Object.hasOwn(lock.inputs, generatorLockPath)
  ) {
    problems.push({
      file: generatorLockPath,
      reason: "generator-lock-missing",
    });
  }

  for (const file of inputKeys) {
    if (inputOutside(dataDir, file)) {
      problems.push({ file, reason: "outside" });
    }
  }
  for (const file of outputKeys) {
    if (outputOutside(dataDir, file)) {
      problems.push({ file, reason: "outside" });
    }
  }

  if (outputKeys.length === 0) {
    problems.push({ file: lockPath, reason: "no-outputs" });
  }

  const listed = [...inputKeys, ...outputKeys];
  for (const file of listed) {
    if (read(file) === undefined) {
      problems.push({ file, reason: "file-missing" });
    }
  }

  for (const file of inputKeys) {
    const bytes = read(file);
    if (bytes !== undefined && sha256Hex(bytes) !== lock.inputs[file]) {
      problems.push({ file, reason: "hash-mismatch" });
    }
  }
  for (const file of outputKeys) {
    const bytes = read(file);
    if (bytes !== undefined && sha256Hex(bytes) !== lock.outputs[file]) {
      problems.push({ file, reason: "hash-mismatch" });
    }
  }

  const known = new Set<string>([lockPath, ...listed]);
  for (const file of dataFiles.filter((item) => !known.has(item)).sort()) {
    problems.push({ file, reason: "unlisted" });
  }

  return problems;
}
