"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { useEffect, useRef, useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

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

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const panel = panelRef.current;
      if (!panel) return;

      const target = e.target as Node | null;
      if (!target) return;

      // If user tapped outside the open mobile panel, close it.
      if (!panel.contains(target)) setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <Disclosure
      as="nav"
      defaultOpen={false}
      onChange={(val: unknown) => setOpen(Boolean(val))}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-20 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-2 focus:-outline-offset-1 focus:outline-[#6B1F2A]">
              <span className="sr-only">Open main menu</span>
              <Bars3Icon
                aria-hidden="true"
                className="block size-6 group-data-open:hidden"
              />
              <XMarkIcon
                aria-hidden="true"
                className="hidden size-6 group-data-open:block"
              />
            </DisclosureButton>
          </div>

          <div className="flex flex-1 items-center justify-center sm:justify-start">
            <Link href="/" className="shrink-0">
              <img src="/logo.png" alt="Youth Forum" className="h-12 w-auto" />
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

      <DisclosurePanel className="sm:hidden" ref={panelRef}>
        <div className="space-y-1 px-4 pt-2 pb-4">
          {navigation.map((item) => (
            <DisclosureButton
              key={item.name}
              as={Link}
              href={item.href}
              className="block rounded-md px-3 py-2 text-base font-medium uppercase tracking-wide text-gray-700 hover:bg-gray-100"
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
