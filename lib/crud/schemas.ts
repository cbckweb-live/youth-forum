import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { CrudSchema } from "./types";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ─── Living Room Episodes ─────────────────────────────────── */

export type Episode = {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string | null;
  display_order: number;
};

export const livingRoomSchema: CrudSchema<Episode> = {
  title: "Living Room Episodes",
  entityLabel: "Episode",
  apiPath: "/api/admin/living-room",
  actionNames: {
    create: "create_episode",
    update: "update_episode",
    delete: "delete_episode",
  },
  fetchRecords: async () => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("living_room_seasons")
      .select("*")
      .order("display_order", { ascending: false });
    if (error) throw error;
    return (data as Episode[]) || [];
  },
  fields: [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "Episode title" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Episode description (optional)", rows: 4 },
    { name: "youtube_url", label: "YouTube URL", type: "text", placeholder: "https://youtube.com/watch?v=...", helpText: "Paste any YouTube link — it will embed automatically" },
    { name: "display_order", label: "Episode Number", type: "number", placeholder: "Episode number", min: 1 },
  ],
  emptyForm: () => ({ title: "", description: "", youtube_url: "", display_order: 1 }),
  formatSubtitle: (r) => `Episode #${r.display_order}`,
};

/* ─── Events ───────────────────────────────────────────────── */

export type Event = {
  id: string;
  title: string;
  event_date: string;
  event_end_date: string | null;
  description: string | null;
  image_url: string | null;
};

export const eventsSchema: CrudSchema<Event> = {
  title: "Events",
  entityLabel: "Event",
  apiPath: "/api/admin/events",
  actionNames: {
    create: "create_event",
    update: "update_event",
    delete: "delete_event",
  },
  fetchRecords: async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    return (data as Event[]) || [];
  },
  fields: [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "Event title" },
    { name: "event_date", label: "Event Date", type: "date", required: true },
    { name: "event_end_date", label: "End Date", type: "date", helpText: "End date (optional — for multi-day events)" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Event description (optional)", rows: 4 },
    { name: "image_url", label: "Event image", type: "image" },
  ],
  fileUploadBucket: "events-media",
  fileUploadCompress: { maxDimension: 1600, quality: 0.78, preferWebp: true },
  emptyForm: () => ({ title: "", event_date: "", event_end_date: null, description: "", image_url: null }),
  formatSubtitle: (r) =>
    new Date(r.event_date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
};

/* ─── Mathetes ─────────────────────────────────────────────── */

export type MathetesEntry = {
  id: string;
  title: string;
  description: string | null;
  photo_url: string | null;
  created_at: string;
};

export const mathetesSchema: CrudSchema<MathetesEntry> = {
  title: "Mathetes Entries",
  entityLabel: "Mathetes Entry",
  apiPath: "/api/admin/mathetes",
  actionNames: {
    create: "create_mathetes",
    update: "update_mathetes",
    delete: "delete_mathetes",
  },
  fetchRecords: async () => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("mathetes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as MathetesEntry[]) || [];
  },
  fields: [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "Entry title" },
    { name: "description", label: "Description", type: "textarea", placeholder: "Description (optional)", rows: 5 },
    { name: "photo_url", label: "Photo", type: "image" },
  ],
  fileUploadBucket: "media",
  fileUploadFolder: "Mathetes",
  emptyForm: () => ({ title: "", description: "", photo_url: null }),
};

/* ─── Gallery Photos ───────────────────────────────────────── */

export type Photo = {
  id: string;
  photo_url: string;
  caption: string | null;
  event_tag: string | null;
  created_at: string;
};

export const gallerySchema: CrudSchema<Photo> = {
  title: "Gallery Photos",
  entityLabel: "Photo",
  apiPath: "/api/admin/gallery",
  actionNames: {
    create: "create",
    update: "update",
    delete: "delete",
  },
  fetchRecords: async () => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Photo[]) || [];
  },
  fields: [
    { name: "photo_url", label: "Photo", type: "image" },
    { name: "caption", label: "Caption", type: "text", placeholder: "Photo caption (optional)" },
    { name: "event_tag", label: "Event Tag", type: "text", placeholder: "e.g. Annual Camp 2024" },
  ],
  fileUploadBucket: "gallery-media",
  emptyForm: () => ({ photo_url: null, caption: "", event_tag: "" }),
  formatSubtitle: (r) => [r.event_tag, r.caption].filter(Boolean).join(" · "),
};

/* ─── Posts ─────────────────────────────────────────────────── */

export type Post = {
  id: string;
  title: string;
  slug: string;
  category: "news" | "blog-opinion";
  content: string;
  author_name: string | null;
  photo_url: string | null;
  pdf_url: string | null;
  published: boolean;
  created_at: string;
};

function formatPostSubtitle(r: Post) {
  const cat =
    r.category === "news" ? CATEGORY_LABELS.news : CATEGORY_LABELS["blog-opinion"];
  const date = new Date(r.created_at).toLocaleDateString();
  return `${cat} · ${date}`;
}

export const postsSchema: CrudSchema<Post> = {
  title: "Posts",
  entityLabel: "Post",
  apiPath: "/api/admin/posts",
  actionNames: {
    create: "create_post",
    update: "update_post",
    delete: "delete_post",
  },
  fetchRecords: async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    return (data as Post[]) || [];
  },
  fields: [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      placeholder: "Post title",
      onChangeSideEffect: (value) => ({ slug: slugify(String(value ?? "")) }),
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      required: true,
      placeholder: "Auto-generated from title",
      helpText: "Auto-generated from the title — you can edit it manually.",
    },
    {
      name: "category",
      label: "Category",
      type: "radio",
      required: true,
      options: [
        { value: "news", label: CATEGORY_LABELS.news },
        { value: "blog-opinion", label: CATEGORY_LABELS["blog-opinion"] },
      ],
    },
    {
      name: "author_name",
      label: "Author Name",
      type: "text",
      placeholder: "Author name (optional)",
    },
    {
      name: "content",
      label: "Content",
      type: "richtext",
    },
    {
      name: "published",
      label: "Publish immediately",
      type: "checkbox",
    },
  ],
  emptyForm: () => ({
    title: "",
    slug: "",
    category: "news",
    content: "",
    author_name: "",
    photo_url: null,
    pdf_url: null,
    published: false,
  }),
  formatSubtitle: formatPostSubtitle,
};

/* ─── Office Bearers ───────────────────────────────────────── */

export type OfficeBearer = {
  id: string;
  name: string;
  role: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  team_id: string | null;
  display_order: number;
};

export const officeBearersSchema: CrudSchema<OfficeBearer> = {
  title: "Office Bearers",
  entityLabel: "Person",
  apiPath: "/api/admin/office-bearers",
  actionNames: {
    create: "create_person",
    update: "update_person",
    delete: "delete_person",
  },
  fetchRecords: async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("office_bearers")
      .select("*")
      .order("display_order", { ascending: true });
    return (data as OfficeBearer[]) || [];
  },
  fields: [
    { name: "name", label: "Full Name", type: "text", required: true, placeholder: "Full name" },
    { name: "role", label: "Role / Title", type: "text", placeholder: "Role or title" },
    { name: "photo_url", label: "Photo", type: "image" },
    { name: "phone", label: "Phone", type: "text", placeholder: "Phone number (optional)" },
    { name: "email", label: "Email", type: "email", placeholder: "Email address (optional)" },
    { name: "bio", label: "Bio", type: "richtext" },
  ],
  fileUploadBucket: "office-bearers-media",
  emptyForm: () => ({ name: "", role: "", photo_url: null, phone: "", email: "", bio: "", team_id: null }),
  formatSubtitle: (r) => r.role ?? "—",
};
