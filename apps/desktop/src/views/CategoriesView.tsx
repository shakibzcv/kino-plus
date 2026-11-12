import React, { useState, useEffect } from "react";
import { MediaItem, WatchlistItem } from "../types";
import { fetchCategories, fetchMediaByCategory } from "../lib/api";
import { getCategoryVisual } from "../lib/categories";
import MediaCard from "../components/MediaCard";
import { GridIcon } from "../components/Icons";

interface CategoriesViewProps {
  onSelectMedia: (item: MediaItem) => void;
  watchlist: WatchlistItem[];
  onToggleWatchlist: (item: MediaItem) => void;
  onPlay?: (item: MediaItem) => void;
}

export default function CategoriesView({
  onSelectMedia,
  watchlist,
  onToggleWatchlist,
  onPlay,
}: CategoriesViewProps): React.ReactElement {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryMedia, setCategoryMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Categories load error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectCategory = async (catName: string) => {
    setSelectedCategory(catName);
    setIsLoadingMedia(true);
    try {
      const items = await fetchMediaByCategory(catName);
      setCategoryMedia(items);
    } catch (err) {
      console.error("Category media load error:", err);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-6 sm:p-10 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <GridIcon className="w-8 h-8 text-[#f2545b]" />
            <span>Categories</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Browse cinematic releases, animated hits, and dramas grouped by genre.</p>
        </div>

        {selectedCategory && (
          <button type="button" onClick={() => setSelectedCategory(null)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
            ← Back to All Categories
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-[#f2545b] rounded-full animate-spin" />
        </div>
      ) : selectedCategory ? (
        /* Category Titles Grid */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Titles in {selectedCategory}</h2>
            <span className="text-xs text-zinc-400">{categoryMedia.length} titles</span>
          </div>

          {isLoadingMedia ? (
            <div className="py-20 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-[#f2545b] rounded-full animate-spin" />
            </div>
          ) : categoryMedia.length === 0 ? (
            <div className="py-20 text-center text-zinc-400 text-sm">No titles currently available for {selectedCategory}.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {categoryMedia.map((item) => (
                <MediaCard key={item.id} item={item} expandOnHover={false} isWatchlisted={watchlist.some((w) => String(w.mediaId) === String(item.id))} onToggleWatchlist={onToggleWatchlist} onClick={onSelectMedia} onPlay={onPlay} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 6-Column Category Cards Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {categories.map((cat) => {
            const visual = getCategoryVisual(cat.name);
            return (
              <div key={cat.id} onClick={() => handleSelectCategory(cat.name)}
                className={`group relative overflow-hidden rounded-xl bg-gradient-to-r ${visual.gradient} p-4 h-[84px] sm:h-[96px] md:h-[105px] flex items-center justify-center text-center shadow-lg transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl hover:brightness-110 active:scale-95 border border-white/10 cursor-pointer`}>
                {/* Wavy texture overlay */}
                <svg viewBox="0 0 300 150" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none opacity-30 group-hover:opacity-40 transition-opacity duration-300">
                  <path d="M0,55 Q75,15 150,65 T300,45 L300,150 L0,150 Z" fill="rgba(255,255,255,0.18)" />
                  <path d="M0,90 Q85,130 180,75 T300,105 L300,150 L0,150 Z" fill="rgba(255,255,255,0.12)" />
                  <path d="M0,30 Q110,80 220,25 T300,60 L300,0 L0,0 Z" fill="rgba(0,0,0,0.16)" />
                </svg>
                <span className="relative z-10 text-xs sm:text-sm md:text-base font-bold text-white tracking-wide drop-shadow-md select-none">{cat.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
