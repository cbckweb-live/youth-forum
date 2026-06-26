export type PdfCompressOptions = {
  maxBytes?: number;
};

export async function compressPdfFile(
  file: File,
  opts: PdfCompressOptions = {},
): Promise<File> {
  // 1. Quick validation: Ensure it's a PDF
  if (!file.type || !file.type.toLowerCase().includes("pdf")) return file;

  // 2. Optimization: Skip compression if the file is already small enough
  if (opts.maxBytes && file.size <= opts.maxBytes) {
    return file;
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    
    // Optional: Send maxBytes to the backend if your API supports tuning
    if (opts.maxBytes) {
      formData.append("maxBytes", opts.maxBytes.toString());
    }

    const response = await fetch("/api/compress-pdf", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("Server-side PDF compression failed:", response.status, errorText);
      return file;
    }

    const compressedBlob = await response.blob();

    // 3. Check if the server's output satisfies the maxBytes constraint
    if (opts.maxBytes && compressedBlob.size > opts.maxBytes) {
      console.warn(`Compressed PDF (${compressedBlob.size} bytes) still exceeds maxBytes (${opts.maxBytes}). Returning original.`);
      return file;
    }

    // 4. Check if the server output is actually an improvement
    if (compressedBlob.size >= file.size) {
      return file;
    }

    // Extract the base name safely (fallback to original name if no dot exists)
    const dotIndex = file.name.lastIndexOf(".");
    const base = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
    
    return new File([compressedBlob], `${base}-compressed.pdf`, { type: "application/pdf" });
  } catch (error) {
    console.warn("Client-side PDF compression fallback to original:", error);
    return file;
  }
}