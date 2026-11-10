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

export function sha256Hex(bytes: Uint8Array): string {
  return "";
}

export function findDataDirs(paths: readonly string[]): string[] {
  return [];
}

export function checkDataDir(
  dataDir: string,
  dataFiles: readonly string[],
  read: (path: string) => Uint8Array | undefined,
): DataProblem[] {
  return [];
}
