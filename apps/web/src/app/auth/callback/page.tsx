"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setClientTokens } from "../../../lib/auth.client";

/**
 * OAuth Callback Page
 *
 * The backend redirects here after a successful Google OAuth flow:
 *   GET /auth/callback?token=<accessToken>&refreshToken=<refreshToken>&client=desktop
 *
 * For web: immediately stores tokens and navigates home ("/").
 * For desktop: forwards tokens to the desktop app via deep link & loopback,
 * and provides a manual "Open Kino+ Desktop" button.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [isDesktopClient, setIsDesktopClient] = useState(false);
  const [deepLinkUrl, setDeepLinkUrl] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");
    const client = params.get("client");

    if (token) {
      setClientTokens(token, refreshToken);
    }

    if (client === "desktop" && token) {
      setIsDesktopClient(true);
      const deepLink = `kinoplus://auth/callback?token=${encodeURIComponent(token)}${refreshToken ? `&refreshToken=${encodeURIComponent(refreshToken)}` : ""}`;
      setDeepLinkUrl(deepLink);

      // 1. Send to desktop local loopback server (fail silently if not running)
      const loopbackUrl = `http://127.0.0.1:45678/callback?token=${encodeURIComponent(token)}${refreshToken ? `&refreshToken=${encodeURIComponent(refreshToken)}` : ""}`;
      fetch(loopbackUrl, { mode: "no-cors" }).catch(() => {});

      // 2. Trigger native OS deep link
      window.location.href = deepLink;
    } else {
      router.replace("/");
    }
  }, [router]);

  if (isDesktopClient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0e1013] px-6 text-center">
        <div className="w-16 h-16 mb-6 rounded-2xl bg-[#f2545b]/10 border border-[#f2545b]/20 flex items-center justify-center text-3xl">
          🍿
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          Signed in to Kino+
        </h1>
        <p className="text-zinc-400 text-sm max-w-sm mb-6">
          You are signed in! Returning to the desktop app. If it didn&apos;t open automatically, click below.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {deepLinkUrl && (
            <a
              href={deepLinkUrl}
              className="px-6 py-2.5 rounded-lg bg-[#f2545b] hover:bg-[#ff757b] text-white text-sm font-semibold transition-colors shadow-lg shadow-[#f2545b]/20"
            >
              Open Kino+ Desktop
            </a>
          )}
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="px-5 py-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-sm font-medium transition-colors"
          >
            Continue on Web
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0e1013] gap-4">
      {/* Spinner */}
      <div className="w-12 h-12 rounded-full border-4 border-[#f2545b]/30 border-t-[#f2545b] animate-spin" />
      <p className="text-[#f1f5f9]/60 text-sm tracking-wide">
        Signing you in…
      </p>
    </div>
  );
}
