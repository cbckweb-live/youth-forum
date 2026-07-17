"use client";

import { useState, useEffect } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 400);
    }
    // Check initial scroll position
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center bg-white/70 dark:bg-[#2a2a2a]/70 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#6B1F2A] dark:text-[#B84C5C] hover:bg-white dark:hover:bg-[#3a3a3a] hover:shadow-lg dark:hover:shadow-[0_6px_30px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
