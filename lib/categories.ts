export const CATEGORY_LABELS: Record<string, string> = {
  news: "News",
  "blog-opinion": "Blog & Opinion",
};

export const CATEGORY_SLUGS = ["news", "blog-opinion"] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
