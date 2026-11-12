"use client";

import React from "react";
import Link from "next/link";

interface AccountSidebarProps {
  activeTab: "account" | "sessions";
}

export default function AccountSidebar({ activeTab }: AccountSidebarProps) {
  return (
    <aside className="w-full md:w-56 lg:w-60 flex-shrink-0 md:border-r md:border-[#26282e] md:pr-6 lg:pr-8 pb-3.5 md:pb-0 border-b border-[#26282e]/50 md:border-b-0">
      <nav className="flex flex-row md:flex-col gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
        <Link
          href="/account"
          className={`text-left text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap self-start ${
            activeTab === "account"
              ? "border border-zinc-600 rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-white bg-white/5 shadow-sm"
              : "px-4 sm:px-5 py-1.5 sm:py-2 text-zinc-400 hover:text-white"
          }`}
        >
          Account
        </Link>
        <Link
          href="/account/sessions"
          className={`text-left text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap self-start ${
            activeTab === "sessions"
              ? "border border-zinc-600 rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-white bg-white/5 shadow-sm"
              : "px-4 sm:px-5 py-1.5 sm:py-2 text-zinc-400 hover:text-white"
          }`}
        >
          Sessions
        </Link>
      </nav>
    </aside>
  );
}
