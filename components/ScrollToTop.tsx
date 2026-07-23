"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const BTN_SIZE = 44; // w-11 = 44px
const DEFAULT_POSITION = { left: 24, bottom: 24 };
const STORAGE_KEY = "scrollToTopPosition";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState(DEFAULT_POSITION);

  const wasDragged = useRef(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startLeft: number;
    startBottom: number;
  } | null>(null);
  const positionRef = useRef(position);
  positionRef.current = position;

  // ----- Restore saved position -----
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.left === "number" && typeof parsed.bottom === "number") {
          setPosition(parsed);
        }
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // ----- Show / hide on scroll -----
  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 400);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ----- Clamp on resize -----
  useEffect(() => {
    function handleResize() {
      setPosition((prev) => ({
        left: Math.min(prev.left, window.innerWidth - BTN_SIZE - 8),
        bottom: Math.min(prev.bottom, window.innerHeight - BTN_SIZE - 8),
      }));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ----- Drag handlers (stable references via useRef pattern) -----
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current) return;
    const dx = clientX - dragRef.current.startX;
    const dy = dragRef.current.startY - clientY; // inverted because bottom increases ↑

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      wasDragged.current = true;
    }

    const newLeft = Math.max(
      0,
      Math.min(window.innerWidth - BTN_SIZE, dragRef.current.startLeft + dx)
    );
    const newBottom = Math.max(
      0,
      Math.min(window.innerHeight - BTN_SIZE, dragRef.current.startBottom + dy)
    );
    setPosition({ left: newLeft, bottom: newBottom });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragRef.current) {
      setDragging(false);
      if (wasDragged.current) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(positionRef.current));
      }
      dragRef.current = null;
    }
  }, []);

  // ----- Click / drag action -----
  function scrollToTop() {
    if (!wasDragged.current) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ----- Mouse drag (listeners attached synchronously to avoid race) -----
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    wasDragged.current = false;
    setDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: position.left,
      startBottom: position.bottom,
    };

    const onMove = (me: MouseEvent) => handleDragMove(me.clientX, me.clientY);
    const onUp = () => {
      handleDragEnd();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ----- Touch drag (listeners attached synchronously) -----
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    wasDragged.current = false;
    setDragging(true);
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startLeft: position.left,
      startBottom: position.bottom,
    };

    const onMove = (te: TouchEvent) => {
      te.preventDefault();
      handleDragMove(te.touches[0].clientX, te.touches[0].clientY);
    };
    const onEnd = () => {
      handleDragEnd();
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };

    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  };

  return (
    <button
      onClick={scrollToTop}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      aria-label="Scroll to top"
      style={{
        left: `${position.left}px`,
        bottom: `${position.bottom}px`,
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      className={`fixed z-50 w-11 h-11 rounded-full flex items-center justify-center bg-white/70 dark:bg-[#2a2a2a]/70 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#6B1F2A] dark:text-[#B84C5C] group hover:bg-white dark:hover:bg-[#3a3a3a] hover:shadow-lg dark:hover:shadow-[0_6px_30px_rgba(0,0,0,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1F2A] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] select-none ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      } ${dragging ? "!transition-none scale-110 shadow-2xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)]" : "hover:-translate-y-0.5"}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 pointer-events-none"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>

      {/* Subtle drag handle dots visible on hover */}
      <span
        className={`absolute -top-1 -right-1 flex gap-[2px] transition-opacity duration-200 ${
          dragging ? "opacity-100" : "opacity-0 group-hover:opacity-60"
        }`}
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-[#6B1F2A] dark:bg-[#B84C5C]"
          />
        ))}
      </span>
    </button>
  );
}