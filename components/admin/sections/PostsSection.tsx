"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useAdminCrudSection } from "@/lib/hooks/useAdminCrudSection";
import RichTextEditor from "@/components/admin/RichTextEditor";
import FileUploadInput from "@/components/admin/FileUploadInput";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { CATEGORY_LABELS } from "@/lib/categories";

type Post = {
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

const emptyPost = (): Omit<Post, "id" | "created_at"> => ({
  title: "",
  slug: "",
  category: "news",
  content: "",
  author_name: "",
  photo_url: null,
  pdf_url: null,
  published: false,
});

const MAX_PDF_BYTES = 10 * 1024 * 1024;

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function validatePdf(file: File): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Invalid file type. Please upload a PDF.";
  if (file.size > MAX_PDF_BYTES) return "File too large. Please upload a PDF smaller than 10 MB.";
  return null;
}

export default function PostsSection() {
  const supabase = createSupabaseBrowserClient();

  const {
    records: posts,
    editingId,
    showModal,
    saving,
    error,
    confirmDeleteId,
    openNew,
    openEdit,
    closeModal: resetModal,
    executeSubmit,
    handleDelete,
    setConfirmDeleteId,
    fetchData,
    setError,
  } = useAdminCrudSection<Post>({
    apiPath: "/api/admin/posts",
    actionNames: { create: "create_post", update: "update_post", delete: "delete_post" },
    fetchRecords: async () => {
      const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
      return (data as Post[]) || [];
    },
  });

  const [form, setForm] = useState(emptyPost());
  const [mediaType, setMediaType] = useState<"none" | "photo" | "pdf">("none");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previousPhotoUrl, setPreviousPhotoUrl] = useState<string | null>(null);
  const [previousPdfUrl, setPreviousPdfUrl] = useState<string | null>(null);

  async function uploadMedia(file: File, type: "photo" | "pdf"): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("bucket", type === "photo" ? "posts-media" : "posts-pdf");

    const response = await fetch("/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();
    let result: unknown;
    try { result = responseText ? JSON.parse(responseText) : {}; } catch { result = { error: responseText }; }

    const errorFromApi = (() => {
      if (typeof result !== "object" || result === null) return undefined;
      const maybe = result as Record<string, unknown>;
      const err = maybe["error"];
      return typeof err === "string" ? err : undefined;
    })();

    if (!response.ok) {
      throw new Error(errorFromApi || responseText || "Failed to upload media.");
    }

    const url = (() => {
      if (typeof result !== "object" || result === null) return undefined;
      const maybe = result as Record<string, unknown>;
      const u = maybe["url"];
      return typeof u === "string" ? u : undefined;
    })();

    if (!url) throw new Error("No URL returned from server.");
    return url;
  }

  function handleEdit(post: Post) {
    openEdit(post);
    setPreviousPhotoUrl(post.photo_url);
    setPreviousPdfUrl(post.pdf_url);
    setForm({
      title: post.title,
      slug: post.slug,
      category: post.category,
      content: post.content,
      author_name: post.author_name,
      photo_url: post.photo_url,
      pdf_url: post.pdf_url,
      published: post.published,
    });
    setMediaType(post.photo_url ? "photo" : post.pdf_url ? "pdf" : "none");
    setMediaFile(null);
    setUploadProgress(null);
  }

  function handleCloseModal() {
    resetModal();
    setForm(emptyPost());
    setPreviousPhotoUrl(null);
    setPreviousPdfUrl(null);
    setMediaType("none");
    setMediaFile(null);
    setUploadProgress(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploadProgress(null);
    await executeSubmit(async () => {
      let photo_url = mediaType === "photo" ? form.photo_url : null;
      let pdf_url = mediaType === "pdf" ? form.pdf_url : null;
      if (mediaFile && mediaType === "photo") photo_url = await uploadMedia(mediaFile, "photo");
      if (mediaFile && mediaType === "pdf") pdf_url = await uploadMedia(mediaFile, "pdf");
      const payload = { ...form, photo_url, pdf_url };
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingId ? "update_post" : "create_post",
          id: editingId,
          previous_photo_url: editingId ? previousPhotoUrl : null,
          previous_pdf_url: editingId ? previousPdfUrl : null,
          ...payload,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to save post.");
      }
    });
    setForm(emptyPost());
    setPreviousPhotoUrl(null);
    setPreviousPdfUrl(null);
    setMediaType("none");
    setMediaFile(null);
    setUploadProgress(null);
  }

  async function togglePublish(post: Post) {
    try {
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_publish", id: post.id, published: !post.published }),
      });
      if (!response.ok) {
        const text = await response.text();
        setError(text || "Failed to update publish status.");
        return;
      }
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update publish status.");
    }
  }

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]";

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => { openNew(); setForm(emptyPost()); setMediaType("none"); }}
          className="bg-[#6B1F2A] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7d2432] transition-colors"
        >
          + New Post
        </button>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="bg-white dark:bg-[#1e1e1e] shadow-sm dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium text-sm">{post.title}</p>
              <p className="text-xs text-[#231F1E]/50 dark:text-gray-400">
                {post.category === "news" ? CATEGORY_LABELS.news : CATEGORY_LABELS["blog-opinion"]} ·{" "}
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button onClick={() => togglePublish(post)} className={`${post.published ? "text-green-600" : "text-gray-400"} hover:underline`}>
                {post.published ? "Published" : "Draft"}
              </button>
              <button onClick={() => handleEdit(post)} className="text-[#6B1F2A] dark:text-[#B84C5C] hover:underline">Edit</button>
              <button onClick={() => setConfirmDeleteId(post.id)} className="text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-sm text-[#231F1E]/50 dark:text-gray-400">No posts yet.</p>}
      </div>

      {confirmDeleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this post?"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="font-display text-lg dark:text-[#e5e5e5]">{editingId ? "Edit Post" : "New Post"}</h2>
              <button type="button" onClick={handleCloseModal} aria-label="Close" className="text-[#231F1E]/50 dark:text-gray-400 hover:text-[#231F1E] dark:hover:text-[#e5e5e5] transition-colors">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} required className={inputCls} />
              <input type="text" placeholder="Slug (auto-generated)" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} required className={inputCls} />
              <div className="flex gap-4">
                {(["news", "blog-opinion"] as const).map((cat) => (
                  <label key={cat} className="flex items-center gap-2 text-sm dark:text-[#e5e5e5]">
                    <input type="radio" checked={form.category === cat} onChange={() => setForm({ ...form, category: cat })} />
                    {CATEGORY_LABELS[cat]}
                  </label>
                ))}
              </div>
              <input type="text" placeholder="Author name (optional)" value={form.author_name || ""} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className={inputCls} />
              <RichTextEditor key={editingId || 'new'} value={form.content} onChange={(val) => setForm({ ...form, content: val })} />

              <div>
                <p className="text-sm text-[#231F1E]/60 dark:text-gray-400 mb-2">Attach media (optional — photo or PDF, not both)</p>
                <div className="flex gap-4 mb-3">
                  {(["none", "photo", "pdf"] as const).map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm capitalize">
                      <input type="radio" checked={mediaType === type} onChange={() => { setMediaType(type); setMediaFile(null); setUploadProgress(null); }} />
                      {type}
                    </label>
                  ))}
                </div>
                {mediaType !== "none" && (
                  <FileUploadInput
                    accept={mediaType === "photo" ? "image/*" : "application/pdf"}
                    label={`Upload ${mediaType}`}
                    file={mediaFile}
                    currentUrl={mediaType === "photo" ? form.photo_url : form.pdf_url}
                    progress={uploadProgress}
                    onChange={(files) => {
                      const f = files?.[0] || null;
                      if (!f) { setMediaFile(null); return; }
                      if (mediaType === "pdf") {
                        const validationError = validatePdf(f);
                        if (validationError) { alert(validationError); setMediaFile(null); setUploadProgress(null); return; }
                      }
                      if (mediaType === "photo" && !f.type.startsWith("image/")) {
                        alert("Invalid file type. Please upload an image.");
                        setMediaFile(null); setUploadProgress(null); return;
                      }
                      setMediaFile(f);
                    }}
                  />
                )}
              </div>

              <label className="flex items-center gap-2 text-sm dark:text-[#e5e5e5]">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                Publish immediately
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60">
                  {saving ? "Saving..." : editingId ? "Update Post" : "Create Post"}
                </button>
                <button type="button" onClick={handleCloseModal} className="text-sm text-[#231F1E]/50 dark:text-gray-400 hover:underline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
