"use client";

import { useRef, useEffect, useState, startTransition } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type Props = {
  siteKey: string;
  onToken: (token: string | null) => void;
  theme?: "light" | "dark" | "auto";
};

export default function TurnstileWidget({ siteKey, onToken, theme = "auto" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Script already loaded?
    if (document.querySelector('script[src*="turnstile"]')) {
      if (window.turnstile) {
        startTransition(() => setLoaded(true));
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => startTransition(() => setLoaded(true));
    document.body.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!loaded || !window.turnstile || !containerRef.current) return;

    // Clean up previous widget
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => onToken(token),
      "expired-callback": () => {
        onToken(null);
        // Re-render on expiry
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
      "error-callback": () => onToken(null),
      theme,
    });
  }, [loaded, siteKey, onToken, theme]);

  return <div ref={containerRef} className="flex justify-center" />;
}
