"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  const [clicked, setClicked] = useState(false);

  function triggerError() {
    setClicked(true);
    Sentry.captureException(new Error("Sentry test error from CBCK Youth Forum"));
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-2xl mb-4">Sentry Test Page</h1>
      <p className="text-[#231F1E]/70 mb-8 max-w-md">
        Click the button below to trigger a test error. If Sentry is configured
        correctly, this error should appear in your Sentry dashboard.
      </p>
      <button
        onClick={triggerError}
        className="bg-[#6B1F2A] text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-[#7d2432] transition-colors"
      >
        {clicked ? "Error sent — check Sentry!" : "Trigger Test Error"}
      </button>
    </main>
  );
}
