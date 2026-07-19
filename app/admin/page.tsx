"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import TurnstileWidget from "@/components/TurnstileWidget";

const TURNSTILE_SITE_KEY =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    : "";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleCaptchaToken = useCallback((token: string | null) => {
    setCaptchaToken(token);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    // Require CAPTCHA if the site key is configured
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Please complete the security check.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });

    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
      // Reset CAPTCHA so the user gets a fresh challenge
      setCaptchaToken(null);
    } else {
      router.push("/admin/dashboard");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 dark:bg-[#151515] dark:text-[#e5e5e5]">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl mb-2 text-center">Admin Login</h1>
        <p className="text-sm text-[#231F1E]/50 dark:text-gray-400 text-center mb-8">CBCK Content Management</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]"
          />
          <input
            type="password"
            placeholder="Password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]"
          />
          {TURNSTILE_SITE_KEY && (
            <TurnstileWidget
              siteKey={TURNSTILE_SITE_KEY}
              onToken={handleCaptchaToken}
              theme="auto"
            />
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6B1F2A] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
