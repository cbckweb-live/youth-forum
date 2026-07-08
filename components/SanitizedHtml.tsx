import sanitizeHtml from "sanitize-html";
import { decodeHtmlEntities } from "@/lib/utils";

export default function SanitizedHtml({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(decodeHtmlEntities(html)) }}
    />
  );
}
