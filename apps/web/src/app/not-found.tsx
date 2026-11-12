import React from "react";
import Link from "next/link";
import KinoLogo from "../components/KinoLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#141518] text-white flex flex-col justify-between selection:bg-[#f2545b]/30 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#25282e]/80 bg-[#18191c]/90 backdrop-blur-md sticky top-0 z-50">
        <KinoLogo href="/" size="md" />
        <Link
          href="/"
          className="text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
        >
          Return Home
        </Link>
      </header>

      {/* Main 404 Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-16 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#f2545b]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-[#f2545b]/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          {/* 404 Large Display */}
          <h1 className="text-7xl sm:text-9xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            404
          </h1>

          {/* Heading */}
          <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Lost in the Cinema
          </h2>

          {/* Subtext */}
          <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-md leading-relaxed">
            The channel, title, or scene you are looking for is currently
            off-air or does not exist.
          </p>

          {/* CTA Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <Link
              href="/"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#f2545b] hover:bg-[#e0434b] active:scale-95 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-[#f2545b]/25 flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>Back to Home</span>
            </Link>

            <Link
              href="/live-tv"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#24272d] hover:bg-[#2e323a] active:scale-95 text-white font-semibold text-sm transition-all duration-200 border border-[#383c46] flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
              <span>Browse Live TV</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-zinc-500 border-t border-[#202226]">
        <p>&copy; {new Date().getFullYear()} Kino+. All rights reserved.</p>
      </footer>
    </div>
  );
}
