"use client";

import { useEffect, useState, useCallback } from "react";
import ToastContainer, { showToast } from "@/components/admin/Toast";

type GoLiveState = "loading" | "not-launched" | "launched";

export default function GoLiveSection() {
  const [state, setState] = useState<GoLiveState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showLaunchConfirm, setShowLaunchConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [signalSent, setSignalSent] = useState(false);

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
      // If we're still showing "signal sent" after a reload, clear it
      if (!json.launched) setSignalSent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load launch status.");
      setState("not-launched");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Document-level Escape key handler for the confirm dialogs
  useEffect(() => {
    if (!showLaunchConfirm && !showResetConfirm) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLaunchConfirm(false);
        setShowResetConfirm(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showLaunchConfirm, showResetConfirm]);

  async function handleLaunch() {
    setLaunching(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/go-live", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || `Failed to go live (${res.status}).`);
      }
      setSignalSent(true);
      const msg = (data as { warning?: string }).warning
        ? `Launch signal sent ✓ (${(data as { warning?: string }).warning})`
        : "Launch signal sent ✓";
      showToast(msg, "success");
      setState("launched");
      setShowLaunchConfirm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to go live.";
      showToast(msg, "error");
      setError(msg);
    } finally {
      setLaunching(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/go-live", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || `Failed to reset launch (${res.status}).`);
      }
      const msg = (data as { warning?: string }).warning
        ? `Launch reset ✓ (${(data as { warning?: string }).warning})`
        : "Launch reset ✓ — the coming-soon page will re-engage.";
      showToast(msg, "success");
      setState("not-launched");
      setSignalSent(false);
      setShowResetConfirm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reset launch.";
      showToast(msg, "error");
      setError(msg);
    } finally {
      setResetting(false);
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full px-4 py-2 text-sm font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                Site is LIVE
              </span>
              <p className="text-xs text-[#231F1E]/50 dark:text-gray-400">
                The coming-soon gate is disabled for all visitors.
              </p>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={resetting}
              className="bg-gray-200 dark:bg-[#2a2a2a] text-[#231F1E] dark:text-[#e5e5e5] rounded-lg px-4 py-2 text-xs font-medium hover:bg-gray-300 dark:hover:bg-[#3a3a3a] transition-colors disabled:opacity-60 shrink-0"
            >
              {resetting ? "Resetting..." : "Reset Launch"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {signalSent ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full px-4 py-2 text-sm font-medium">
                    <span className="inline-block w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Launch signal sent ✓
                  </span>
                  <p className="text-xs text-[#231F1E]/50 dark:text-gray-400">
                    The LCD device will detect this and reveal the site within seconds.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-[#231F1E] dark:text-[#e5e5e5]">
                    The site is currently in coming-soon mode.
                  </p>
                  <p className="text-xs text-[#231F1E]/50 dark:text-gray-400 mt-1">
                    Going live will make the site public immediately for all visitors. This cannot be automatically undone.
                  </p>
                </>
              )}
            </div>
            <button
              onClick={() => setShowLaunchConfirm(true)}
              disabled={signalSent}
              className="bg-[#6B1F2A] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60 shrink-0"
            >
              {signalSent ? "Sent ✓" : "Go Live"}
            </button>
          </div>
        )}
      </div>

      {/* Launch confirm dialog */}
      {showLaunchConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowLaunchConfirm(false)}
        >
          <div
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-center text-[#231F1E] dark:text-[#e5e5e5] mb-5">
              This will make the site public immediately for all visitors. Continue?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowLaunchConfirm(false)}
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

      {/* Reset confirm dialog */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-center text-[#231F1E] dark:text-[#e5e5e5] mb-5">
              This will re-enable the coming-soon gate. Visitors will see the coming-soon page again. Continue?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="px-4 py-2 text-sm font-medium text-[#231F1E]/60 dark:text-gray-400 hover:text-[#231F1E] dark:hover:text-[#e5e5e5] bg-gray-100 dark:bg-[#2a2a2a] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-60"
              >
                {resetting ? "Resetting..." : "Yes, Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
