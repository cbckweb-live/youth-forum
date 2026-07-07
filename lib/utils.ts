export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const trimmed = url.trim();

    // If user pasted only a raw id, accept it (best-effort: 11 chars)
    if (!/^https?:\/\//i.test(trimmed) && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return `https://www.youtube.com/embed/${trimmed}`;
    }

    const normalizedUrl = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    const parsed = new URL(normalizedUrl);
    const hostname = parsed.hostname.replace(/^www\./, "");

    let videoId: string | null = null;

    // youtu.be/<id>
    if (hostname === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] || null;
    }

    // youtube.com/watch?v=<id>
    if (!videoId && (hostname.endsWith("youtube.com") || hostname.endsWith("youtube-nocookie.com"))) {
      videoId = parsed.searchParams.get("v");

      // youtube.com/<path>/<id> e.g. shorts/<id>, live/<id>, embed/<id>, v/<id>
      if (!videoId) {
        const segments = parsed.pathname.split("/").filter(Boolean);
        const supported = new Set(["embed", "shorts", "live", "v"]);
        if (segments.length >= 2 && supported.has(segments[0])) {
          videoId = segments[1] || null;
        }
      }

      // If already in /embed/<id> form but earlier extraction failed, attempt again
      if (!videoId && parsed.pathname.includes("/embed/")) {
        const parts = parsed.pathname.split("/embed/");
        if (parts.length > 1) {
          videoId = parts[1].split("/")[0] || null;
        }
      }
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}


export function decodeHtmlEntities(value: string): string {
  if (!value) return "";

  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  }

  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}
