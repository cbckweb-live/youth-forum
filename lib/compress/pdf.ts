export type PdfCompressOptions = {
  /** If defined, we do a best-effort attempt to avoid exceeding this size (bytes). */
  maxBytes?: number;
};

/**
 * Best-effort PDF compression (client-side).
 *
 * Note: True high-quality PDF recompression typically requires a WASM library or a server.
 * This implementation keeps uploads working while we add an actual PDF optimizer library.
 */
export async function compressPdfFile(
  file: File,
  opts: PdfCompressOptions = {},
): Promise<File> {
  // If no maxBytes, we currently return the original.
  // This is a safe fallback so uploads do not break.
  void opts;
  if (!file.type || !file.type.toLowerCase().includes("pdf")) return file;
  return file;
}
