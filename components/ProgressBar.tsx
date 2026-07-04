"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// Configure NProgress options (speeds, turning off the small spinning circle icon, etc.)
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 });

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Whenever the URL path or search parameters change, complete the progress bar
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept all document clicks to catch Next.js <Link> navigations
    const handleAnchorClick = (event: MouseEvent) => {
      const targetTarget = event.target as HTMLElement;
      const anchor = targetTarget.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        const target = anchor.getAttribute("target");

        // Only trigger loader if it's an internal link and not opening in a new tab
        if (href && href.startsWith("/") && !href.startsWith("#") && target !== "_blank") {
          // Optional: Don't trigger if clicking the link to the page we are already on
          if (href !== window.location.pathname) {
            NProgress.start();
          }
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    
    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  return null; // This component handles logic and injects styles globally, it renders no HTML element directly
}