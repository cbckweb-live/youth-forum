import { convert } from "html-to-text";

export function truncate(html: string, maxChars: number): string {
  const plain = convert(html, { wordwrap: false });
  if (plain.length <= maxChars) return plain;
  return plain.slice(0, maxChars).trimEnd() + "…";
}
