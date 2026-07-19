"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

export type ToastData = {
  message: string;
  type: ToastType;
  id: number;
};

let toastIdCounter = 0;
let globalSetToasts: ((updater: (prev: ToastData[]) => ToastData[]) => void) | null = null;

/**
 * Show a toast notification from anywhere in the admin dashboard.
 * Must be called after <ToastContainer /> is mounted.
 */
export function showToast(message: string, type: ToastType = "success") {
  if (globalSetToasts) {
    const id = ++toastIdCounter;
    globalSetToasts((prev) => [...prev, { message, type, id }]);
    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      globalSetToasts?.((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }
}

/**
 * Renders the toast container at the current position.
 * Place once in a layout or section wrapper.
 */
export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    globalSetToasts = setToasts;
    return () => {
      globalSetToasts = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: ToastData }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on next frame
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const bgColor = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-[#6B1F2A]",
  }[toast.type];

  const icon = {
    success: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
      </svg>
    ),
  }[toast.type];

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${bgColor} ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
      }`}
    >
      {icon}
      <span>{toast.message}</span>
    </div>
  );
}
