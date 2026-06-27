"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import RichTextEditor from "@/components/admin/RichTextEditor";
import FileUploadInput from "@/components/admin/FileUploadInput";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

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

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB — module scope, not re-created on render

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Centralised PDF validation — used by both onChange and uploadMedia
function validatePdf(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Invalid file type. Please upload a PDF.";
  if (file.size > MAX_PDF_BYTES)
    return "File too large. Please upload a PDF smaller than 10 MB.";
  return null;
}

export default function PostsSection() {
  const supabase = createSupabaseBrowserClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState(emptyPost());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mediaType, setMediaType] = useState<"none" | "photo" | "pdf">("none");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data as Post[]) || []);
  }, [supabase]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchPosts();
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchPosts]);

  async function uploadMedia(file: File, type: "photo" | "pdf"): Promise<string> {
    if (type === "pdf") {
      // Re-validate at upload time — catches edit-flow cases that bypass onChange
      const validationError = validatePdf(file);
      if (validationError) {
        alert(validationError);
        throw new Error(validationError);
      }
    }

    if (type === "photo" && !file.type.startsWith("image/")) {
      const msg = "Invalid file type. Please upload an image.";
      alert(msg);
      throw new Error(msg);
    }

    const { compressImageFile } = await import("@/lib/compress");
    const bucket = type === "photo" ? "posts-media" : "posts-pdf";

    const toUpload =
      type === "photo"
        ? await compressImageFile(file, {
            maxDimension: 1600,
            quality: 0.78,
            preferWebp: true,
          })
        : file;

    const path = `${Date.now()}-${toUpload.name}`;
    setUploadProgress(10);
    const { error } = await supabase.storage.from(bucket).upload(path, toUpload);
    if (error) throw error;
    setUploadProgress(100);
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setUploadProgress(null);
    try {
      let photo_url = mediaType === "photo" ? form.photo_url : null;
      let pdf_url = mediaType === "pdf" ? form.pdf_url : null;
      if (mediaFile && mediaType === "photo")
        photo_url = await uploadMedia(mediaFile, "photo");
      if (mediaFile && mediaType === "pdf")
        pdf_url = await uploadMedia(mediaFile, "pdf");
      const payload = { ...form, photo_url, pdf_url };
      if (editingId) {
        await supabase.from("posts").update(payload).eq("id", editingId);
      } else {
        await supabase.from("posts").insert(payload);
      }
      closeModal();
      fetchPosts();
    } catch (err) {
      console.error(err);
      setError(`Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(post: Post) {
    setEditingId(post.id);
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
    setShowModal(true);
  }

  function closeModal() {
    setForm(emptyPost());
    setEditingId(null);
    setMediaType("none");
    setMediaFile(null);
    setUploadProgress(null);
    setError(null);
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("posts").delete().eq("id", id);
    setConfirmDeleteId(null);
    fetchPosts();
  }

  async function togglePublish(post: Post) {
    await supabase
      .from("posts")
      .update({ published: !post.published })
      .eq("id", post.id);
    fetchPosts();
  }

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]";

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            setEditingId(null);
            setForm(emptyPost());
            setMediaType("none");
            setShowModal(true);
          }}
          className="bg-[#6B1F2A] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7d2432] transition-colors"
        >
          + New Post
        </button>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white shadow-sm rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <p className="font-medium text-sm">{post.title}</p>
              <p className="text-xs text-[#231F1E]/50">
                {post.category === "news" ? "News" : "Blog / Opinion"} ·{" "}
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() => togglePublish(post)}
                className={`${post.published ? "text-green-600" : "text-gray-400"} hover:underline`}
              >
                {post.published ? "Published" : "Draft"}
              </button>
              <button onClick={() => handleEdit(post)} className="text-[#6B1F2A] hover:underline">
                Edit
              </button>
              <button
                onClick={() => setConfirmDeleteId(post.id)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-[#231F1E]/50">No posts yet.</p>
        )}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="font-display text-lg">
                {editingId ? "Edit Post" : "New Post"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="text-[#231F1E]/50 hover:text-[#231F1E] transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })
                }
                required
                className={inputCls}
              />
              <input
                type="text"
                placeholder="Slug (auto-generated)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                required
                className={inputCls}
              />
              <div className="flex gap-4">
                {(["news", "blog-opinion"] as const).map((cat) => (
                  <label key={cat} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={form.category === cat}
                      onChange={() => setForm({ ...form, category: cat })}
                    />
                    {cat === "news" ? "News" : "Blog / Opinion"}
                  </label>
                ))}
              </div>
              <input
                type="text"
                placeholder="Author name (optional)"
                value={form.author_name || ""}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                className={inputCls}
              />
              <RichTextEditor
                value={form.content}
                onChange={(val) => setForm({ ...form, content: val })}
              />

              <div>
                <p className="text-sm text-[#231F1E]/60 mb-2">
                  Attach media (optional — photo or PDF, not both)
                </p>
                <div className="flex gap-4 mb-3">
                  {(["none", "photo", "pdf"] as const).map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm capitalize">
                      <input
                        type="radio"
                        checked={mediaType === type}
                        onChange={() => {
                          setMediaType(type);
                          setMediaFile(null);
                          setUploadProgress(null);
                        }}
                      />
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
                      if (!f) {
                        setMediaFile(null);
                        return;
                      }
                      if (mediaType === "pdf") {
                        const validationError = validatePdf(f);
                        if (validationError) {
                          alert(validationError);
                          setMediaFile(null);
                          setUploadProgress(null);
                          return;
                        }
                      }
                      if (mediaType === "photo" && !f.type.startsWith("image/")) {
                        alert("Invalid file type. Please upload an image.");
                        setMediaFile(null);
                        setUploadProgress(null);
                        return;
                      }
                      setMediaFile(f);
                    }}
                  />
                )}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                Publish immediately
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update Post" : "Create Post"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm text-[#231F1E]/50 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}