export const binaryExtensions: readonly string[] = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".gif",
  ".ico",
];

export function isBinaryPath(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return binaryExtensions.some((extension) => lower.endsWith(extension));
}

export function utf8Problem(bytes: Uint8Array): "invalid" | "bom" | null {
  let text: string;
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
    text = decoder.decode(bytes);
  } catch {
    return "invalid";
  }
  if (text.startsWith("\uFEFF")) return "bom";
  return null;
}
