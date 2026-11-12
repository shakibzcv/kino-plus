"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import { useUserData } from "../../context/UserDataContext";
import { WatchlistItem } from "../../lib/userData";
import { WatchlistGrid, type RenderWatchlistImage } from "@repo/ui/watchlist-grid";
import { useState } from "react";

// Next.js-optimised image renderer injected into the shared WatchlistGrid
const renderNextImage: RenderWatchlistImage = (src, alt) => (
  <Image
    src={src}
    alt={alt}
    fill
    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
    className="object-cover object-center transition-transform duration-500"
  />
);

export default function WatchlistPage() {
  const router = useRouter();
  const { watchlist, isWatchlistLoading, toggleWatchlist } = useUserData();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleCardClick = (item: WatchlistItem) => {
    if (item.mediaType === "episode") {
      const sId = item.seriesId || item.mediaId.split("_")[0];
      router.push(`/tv/${sId}`);
    } else if (item.mediaType === "tv") {
      router.push(`/tv/${item.mediaId}`);
    } else {
      router.push(`/movie/${item.mediaId}`);
    }
  };

  const handleRemove = async (e: React.MouseEvent, item: WatchlistItem) => {
    e.stopPropagation();
    await toggleWatchlist(item);
  };

  return (
    <div className="min-h-screen w-full bg-[#141518] text-white flex flex-col font-sans select-none pt-[57px]">
      <Header onOpenAuth={() => setIsAuthModalOpen(true)} />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <WatchlistGrid
          items={watchlist as WatchlistItem[]}
          onCardClick={handleCardClick}
          onRemove={handleRemove}
          onBrowse={() => router.push("/movies")}
          renderImage={renderNextImage}
          isLoading={isWatchlistLoading}
        />
      </main>

      <Footer />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
