"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Status = "checking-auth" | "idle" | "loading" | "success" | "error";

interface UpdatePasswordProps {
  redirectTo?: string;
}

export default function UpdatePassword({ redirectTo = "/dashboard" }: UpdatePasswordProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking-auth");
  const [isInvite, setIsInvite] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    async function verifySession() {
      const supabase = createSupabaseBrowserClient();

      setValidationError(null);

      const { data, error } = await supabase.auth.getSession();

      // If we don't yet have a session, try exchanging the auth code (e.g. invite/forgot-password flow).
      if (!data.session && !error) {
        const code = new URL(window.location.href).searchParams.get("code");

        if (code) {
          const { data: codeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (codeData?.session && !exchangeError) {
            const lastSignInAt = (codeData.session.user as { last_sign_in_at?: string | null })
              ?.last_sign_in_at;
            setIsInvite(!lastSignInAt);

            setStatus("idle");
            return;
          }
        }
      }

      if (error || !data.session) {
        setStatus("error");
        return;
      }

      const lastSignInAt = (data.session.user as { last_sign_in_at?: string | null })
        ?.last_sign_in_at;
      setIsInvite(!lastSignInAt);


      setStatus("idle");
    }

    verifySession();
  }, []);


  const headerText = useMemo(() => (isInvite ? "Welcome aboard!" : "Reset your password"), [isInvite]);
  const bodyText = useMemo(
    () =>
      isInvite
        ? "Your account is ready. Choose a secure password to finish setting it up."
        : "Please enter a strong new password to regain account access.",
    [isInvite]
  );
  const buttonText = useMemo(() => (isInvite ? "Complete Registration" : "Update Password"), [isInvite]);
  const successMessage = useMemo(
    () => (isInvite ? "Your account is now ready." : "Your password has been updated."),
    [isInvite]
  );

  const validateForm = useCallback((): boolean => {
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters long.");
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return false;
    }
    setValidationError(null);
    return true;
  }, [password, confirmPassword]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setStatus("loading");
    setValidationError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
    } else {
      setStatus("success");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push(redirectTo);
      }, 2000);
    }
  }

  if (status === "checking-auth") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-lg text-sm">
            Invalid or Expired Link
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center animate-pulse">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="font-display text-lg text-emerald-800 mb-1">Success!</h2>
            <p className="text-sm text-emerald-700">{successMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl mb-2 text-center">{headerText}</h1>
        <p className="text-sm text-gray-600 text-center mb-8">{bodyText}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]"
          />
          {validationError && <p className="text-sm text-rose-600">{validationError}</p>}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-[#6B1F2A] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#7d2432] transition-colors disabled:opacity-60"
          >
            {status === "loading" ? "Saving password..." : buttonText}
          </button>
        </form>
      </div>
    </div>
  );
}