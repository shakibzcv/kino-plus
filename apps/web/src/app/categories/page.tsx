"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import ProtectedRoute from "../../components/ProtectedRoute";
import { CATEGORY_VISUALS, CategoryVisual } from "../../lib/categories";
import { getCategories } from "../../lib/tmdb";

export default function CategoriesHubPage() {
  const [categories, setCategories] = useState<CategoryVisual[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync category names with Express API
  const loadApiCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiCats = await getCategories();
      if (apiCats && apiCats.length > 0) {
        const merged: CategoryVisual[] = apiCats.map((apiCat) => {
          const existing = CATEGORY_VISUALS.find(
            (m) =>
              m.id.replace(/[^a-z0-9]/g, "") ===
                apiCat.id.replace(/[^a-z0-9]/g, "") ||
              m.name.toLowerCase() === apiCat.name.toLowerCase(),
          );
          return {
            id: apiCat.id,
            name: apiCat.name,
            gradient:
              apiCat.gradient ||
              existing?.gradient ||
              "from-[#2b2e36] via-[#353942] to-[#404550]",
            description:
              apiCat.description ||
              existing?.description ||
              `Browse popular ${apiCat.name} movies and TV shows on Kino+.`,
          };
        });
        setCategories(merged);
      } else {
        setError("Internal Server Error: No categories returned.");
      }
    } catch (err) {
      console.error("[Categories] Failed to fetch from API:", err);
      setError(
        "Internal Server Error: Could not connect to streaming service.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApiCategories();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full bg-[#18191c] text-white flex flex-col font-sans select-none pt-[57px]">
        {/* Global Navigation Header */}
        <Header onOpenAuth={() => setIsAuthModalOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Page Title matching user UI */}
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-6 sm:mb-8">
            Categories
          </h1>

          {error ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Internal Server Error
              </h2>
              <p className="text-sm text-zinc-400 max-w-md mb-6">{error}</p>
              <button
                onClick={loadApiCategories}
                className="px-6 py-2.5 rounded-full bg-[#f2545b] text-white font-semibold text-sm hover:bg-[#e0454c] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-4.5">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-[#23262f] animate-pulse h-[84px] sm:h-[96px] md:h-[105px]"
                />
              ))}
            </div>
          ) : (
            /* 6-Column Category Cards Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-4.5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category?name=${encodeURIComponent(cat.name)}`}
                  className={`group relative overflow-hidden rounded-xl bg-gradient-to-r ${cat.gradient} p-4 h-[84px] sm:h-[96px] md:h-[105px] flex items-center justify-center text-center shadow-lg transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl hover:brightness-110 active:scale-95 border border-white/10 cursor-pointer`}
                >
                  {/* Organic Wavy Ribbon Texture SVG Overlay */}
                  <svg
                    viewBox="0 0 300 150"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                  >
                    <path
                      d="M0,55 Q75,15 150,65 T300,45 L300,150 L0,150 Z"
                      fill="rgba(255,255,255,0.18)"
                    />
                    <path
                      d="M0,90 Q85,130 180,75 T300,105 L300,150 L0,150 Z"
                      fill="rgba(255,255,255,0.12)"
                    />
                    <path
                      d="M0,30 Q110,80 220,25 T300,60 L300,0 L0,0 Z"
                      fill="rgba(0,0,0,0.16)"
                    />
                  </svg>

                  {/* Category Label */}
                  <span className="relative z-10 text-xs sm:text-sm md:text-base font-bold text-white tracking-wide drop-shadow-md select-none">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </main>

        {/* Global Footer */}
        <Footer />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
