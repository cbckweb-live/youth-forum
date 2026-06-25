"use client";

import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Gallery", href: "/gallery" },
  { name: "Events", href: "/events" },
  { name: "Mathetes", href: "/mathetes" },
  { name: "Office Bearers", href: "/office-bearers" },
  { name: "Cezo Mepu", href: "/cezo-mepu" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on route change

  // Close on outside click/scroll
  useEffect(() => {
    if (!open) return;

    const close = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const closeOnScroll = () => setOpen(false);

    window.addEventListener("pointerdown", close);
    window.addEventListener("scroll", closeOnScroll, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", closeOnScroll);
    };
  }, [open]);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-20 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-2 focus:-outline-offset-1 focus:outline-[#6B1F2A]"
            >
              <span className="sr-only">Open main menu</span>
              {open ? (
                <XMarkIcon className="size-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="size-6" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center sm:justify-start">
            <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
              <Image src="/logo.png" alt="Youth Forum" className="h-12 w-auto" />
            </Link>

            <div className="hidden sm:ml-12 sm:flex sm:gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium uppercase tracking-wide text-gray-700 hover:text-[#6B1F2A] transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="sm:hidden" ref={panelRef}>
          <div className="space-y-1 px-4 pt-2 pb-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium uppercase tracking-wide text-gray-700 hover:bg-gray-100"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
