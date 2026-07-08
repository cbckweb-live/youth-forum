declare module "sanitize-html" {
  export interface IOptions {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    disallowedTagsMode?: "discard" | "escape" | undefined;
    allowedSchemes?: string[];
    allowedSchemesByTag?: Record<string, string[]>;
    transformTags?: Record<string, unknown>;
    exclusiveFilter?: (frame: unknown) => boolean;
    textFilter?: (text: string) => string;
    [key: string]: unknown;
  }

  export default function sanitizeHtml(
    html: string,
    options?: IOptions
  ): string;
}

