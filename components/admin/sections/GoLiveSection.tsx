"use client";

import { useEffect, useState, useCallback } from "react";
import ToastContainer, { showToast } from "@/components/admin/Toast";

type GoLiveState = "loading" | "not-launched" | "launched";

export default function GoLiveSection() {
  const [state, setState] = useState<GoLiveState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/go-live");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load launch status.");
      }
      const json = await res.json();
      setState(json.launched ? "launched" : "not-launched");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load launch status.");
      setState("not-launched");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Document-level Escape key handler for the confirm dialog
  useEffect(() => {
    if (!showConfirm) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowConfirm(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showConfirm]);

  async function handleLaunch() {
    setLaunching(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/go-live", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || `Failed to go live (${res.status}).`);
      }
      showToast("Site is now live!", "success");
      setState("launched");
      setShowConfirm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to go live.";
      showToast(msg, "error");
      setError(msg);
    } finally {
      setLaunching(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#6B1F2A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <p className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</p>
        <p className="text-xs text-[#231F1E]/50 dark:text-gray-400 mb-4">
          Ensure the <code className="px-1 py-0.5 bg-gray-100 dark:bg-[#2a2a2a] rounded text-[#6B1F2A] dark:text-[#B84C5C]">EDGE_CONFIG</code> and <code className="px-1 py-0.5 bg-gray-100 dark:bg-[#2a2a2a] rounded text-[#6B1F2A] dark:text-[#B84C5C]">EDGE_CONFIG_ID</code> environment variables are set on Vercel, then retry.
        </p>
        <button onClick={load} className="text-[#6B1F2A] dark:text-[#B84C5C] underline text-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />

      <div>
        <h2 className="font-display text-xl dark:text-[#e5e5e5]">Site Launch</h2>
        <p className="text-sm text-[#231F1E]/50 dark:text-gray-400 mt-1">
          Control when the site becomes public.
        </p>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6">
        {state === "launched" ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full px-4 py-2 text-sm font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              Site is LIVE
            </span>
            <p className="text-xs text-[#231F1E]/50 dark:text-gray-400">
              The coming-soon gate is disabled for all visitors.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#231F1E] dark:text-[#e5e5e5]">
                The site is currently in coming-soon mode.
              </p>
              <p className="text-xs text-[#231F1E]/50 dark:text-gray-400 mt-1">
                Going live will make the site public immediately for all visitors. This cannot be automatically undone.
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60 shrink-0"
            >
              Go Live
            </button>
          </div>
        )}
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-center text-[#231F1E] dark:text-[#e5e5e5] mb-5">
              This will make the site public immediately for all visitors. This cannot be automatically undone. Continue?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={launching}
                className="px-4 py-2 text-sm font-medium text-[#231F1E]/60 dark:text-gray-400 hover:text-[#231F1E] dark:hover:text-[#e5e5e5] bg-gray-100 dark:bg-[#2a2a2a] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleLaunch}
                disabled={launching}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#6B1F2A] text-white rounded-lg hover:bg-[#7d2432] transition-colors disabled:opacity-60"
              >
                {launching ? "Launching..." : "Yes, Go Live"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
