"use client";

import React, { useState } from "react";
import Link from "next/link";
import KinoLogo from "./KinoLogo";

export default function Footer(): React.ReactElement {
  const [selectedRegion, setSelectedRegion] = useState("US us");
  const [isRegionOpen, setIsRegionOpen] = useState(false);

  const regions = [
    { code: "US us", label: "United States (English)" },
    { code: "UK en", label: "United Kingdom (English)" },
    { code: "CA en", label: "Canada (English)" },
    { code: "CA fr", label: "Canada (Français)" },
    { code: "AU en", label: "Australia (English)" },
    { code: "DE de", label: "Deutschland (Deutsch)" },
    { code: "ES es", label: "España (Español)" },
    { code: "FR fr", label: "France (Français)" },
    { code: "MX es", label: "México (Español)" },
    { code: "BR pt", label: "Brasil (Português)" },
  ];

  return (
    <footer className="w-full bg-[#111215] text-[#9a9da4] text-xs font-sans border-t border-[#23252b] select-none pt-14 pb-10 mt-auto">
      {/* Full-width inner — uses px padding, no max-w constraint */}
      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20">

        {/* ── Main link grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-10 gap-x-8 mb-12">

          {/* Column 1: Brand + Region */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 flex flex-col gap-4">
            <KinoLogo href="/" size="md" />

            {/* Region dropdown */}
            <div className="relative mt-1">
              <button
                type="button"
                onClick={() => setIsRegionOpen(!isRegionOpen)}
                className="flex items-center gap-3 bg-[#1e2025] hover:bg-[#272a31] text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-md border border-[#323640] transition-colors text-xs font-medium cursor-pointer"
              >
                <span>{selectedRegion}</span>
                <svg className="w-3.5 h-3.5 text-zinc-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isRegionOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsRegionOpen(false)} />
                  <div className="absolute left-0 bottom-full mb-2 w-52 bg-[#1b1c20] border border-[#30333d] rounded-lg shadow-xl py-1.5 z-40 max-h-56 overflow-y-auto">
                    {regions.map((region) => (
                      <button
                        key={region.code}
                        type="button"
                        onClick={() => { setSelectedRegion(region.code); setIsRegionOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#292c35] transition-colors ${
                          selectedRegion === region.code ? "text-[#f2545b] font-bold" : "text-zinc-300"
                        }`}
                      >
                        <span>{region.label}</span>
                        {selectedRegion === region.code && (
                          <svg className="w-3.5 h-3.5 text-[#f2545b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-white font-semibold text-xs mb-1">Company</h4>
            <Link href="#" className="hover:text-white transition-colors">About Us</Link>
            <Link href="#" className="hover:text-white transition-colors">Careers</Link>
            <Link href="#" className="hover:text-white transition-colors">Newsroom</Link>
            <Link href="#" className="hover:text-white transition-colors">Kino Gear</Link>
          </div>

          {/* Column 3: Watch Free */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-white font-semibold text-xs mb-1">Watch Free</h4>
            <Link href="/categories" className="hover:text-white transition-colors">Browse Categories</Link>
            <Link href="/category?name=Action" className="hover:text-white transition-colors">Action Movies</Link>
            <Link href="#" className="hover:text-white transition-colors">What to Watch</Link>
            <Link href="#" className="hover:text-white transition-colors">What to Watch on Netflix</Link>
            <Link href="#" className="hover:text-white transition-colors">What to Watch on Hulu</Link>
            <Link href="#" className="hover:text-white transition-colors">A24 Collection</Link>
          </div>

          {/* Column 4: Kino+ */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-white font-semibold text-xs mb-1">Kino+</h4>
            <Link href="#" className="hover:text-white transition-colors">Go Premium</Link>
            <Link href="#" className="hover:text-white transition-colors">Kino Pass</Link>
            <Link href="#" className="hover:text-white transition-colors">Kino Labs</Link>
            <Link href="#" className="hover:text-white transition-colors">Get Perks</Link>
          </div>

          {/* Column 5: Features */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-white font-semibold text-xs mb-1">Features</h4>
            <Link href="#" className="hover:text-white transition-colors">Kino Media Server</Link>
            <Link href="#" className="hover:text-white transition-colors">Kino Player</Link>
            <Link href="#" className="hover:text-white transition-colors">Kinoamp</Link>
            <Link href="#" className="hover:text-white transition-colors">Kino Photos</Link>
            <Link href="#" className="hover:text-white transition-colors">Kino Dash</Link>
            <Link href="#" className="hover:text-white transition-colors">Download Apps</Link>
          </div>

          {/* Column 6: Community */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-white font-semibold text-xs mb-1">Community</h4>
            <Link href="#" className="hover:text-white transition-colors">Forums</Link>
            <Link href="#" className="hover:text-white transition-colors">Discord</Link>
            <Link href="#" className="hover:text-white transition-colors">Blog</Link>
            <Link href="#" className="hover:text-white transition-colors">Support & Help</Link>
          </div>
        </div>

        {/* ── Bottom bar: copyright + socials ────────────────────────── */}
        <div className="pt-6 border-t border-[#23252b] flex flex-col sm:flex-row items-center justify-between gap-5 text-[11px] text-zinc-500">

          {/* Legal links */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 font-medium">
            <span>Copyright © 2026 Kino</span>
            <span className="text-zinc-700">•</span>
            <Link href="#" className="hover:text-zinc-300 transition-colors">Privacy & Legal</Link>
            <span className="text-zinc-700">•</span>
            <Link href="#" className="hover:text-zinc-300 transition-colors">Accessibility</Link>
            <span className="text-zinc-700">•</span>
            <Link href="#" className="hover:text-zinc-300 transition-colors">Manage Cookies</Link>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-2">
            {/* YouTube */}
            <div aria-disabled="true" className="w-8 h-8 rounded-full bg-[#1b1d22] border border-[#2b2f38] opacity-40 cursor-not-allowed flex items-center justify-center" title="YouTube (Disabled)">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                <polygon fill="#FFFFFF" points="9.545,15.568 9.545,8.432 15.818,12" />
              </svg>
            </div>

            {/* X / Twitter */}
            <div aria-disabled="true" className="w-8 h-8 rounded-full bg-[#1b1d22] border border-[#2b2f38] opacity-40 cursor-not-allowed flex items-center justify-center" title="X (Disabled)">
              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>

            {/* Instagram */}
            <div aria-disabled="true" className="w-8 h-8 rounded-full bg-[#1b1d22] border border-[#2b2f38] opacity-40 cursor-not-allowed flex items-center justify-center" title="Instagram (Disabled)">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <defs>
                  <radialGradient id="footerInstaGrad" cx="30%" cy="107%" r="150%">
                    <stop offset="0%" stopColor="#fdf497" />
                    <stop offset="10%" stopColor="#fdf497" />
                    <stop offset="50%" stopColor="#fd5949" />
                    <stop offset="68%" stopColor="#d6249f" />
                    <stop offset="100%" stopColor="#285AEB" />
                  </radialGradient>
                </defs>
                <path fill="url(#footerInstaGrad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </div>

            {/* Facebook */}
            <div aria-disabled="true" className="w-8 h-8 rounded-full bg-[#1b1d22] border border-[#2b2f38] opacity-40 cursor-not-allowed flex items-center justify-center" title="Facebook (Disabled)">
              <svg className="w-3.5 h-3.5 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>

            {/* GitHub */}
            <div aria-disabled="true" className="w-8 h-8 rounded-full bg-[#1b1d22] border border-[#2b2f38] opacity-40 cursor-not-allowed flex items-center justify-center" title="GitHub (Disabled)">
              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
