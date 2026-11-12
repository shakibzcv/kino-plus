import React from "react";
import { WatchlistGrid } from "@repo/ui/watchlist-grid";
import { MediaItem, WatchlistItem } from "../types";

interface WatchlistViewProps {
  watchlist: WatchlistItem[];
  onToggleWatchlist: (media: MediaItem) => void;
  onSelectMedia: (media: MediaItem) => void;
  onPlay: (media: MediaItem, season?: number, episode?: number) => void;
  onNavigateTab?: (tab: string) => void;
  isLoading?: boolean;
}

export default function WatchlistView({
  watchlist,
  onToggleWatchlist,
  onSelectMedia,
  onPlay,
  onNavigateTab,
  isLoading = false,
}: WatchlistViewProps): React.ReactElement {
  const handleCardClick = (item: WatchlistItem) => {
    if (item.mediaType === "episode") {
      const sId = item.seriesId || item.mediaId.split("_")[0];
      const sNum = item.seasonNumber || 1;
      const epNum = item.episodeNumber || 1;
      onPlay(
        {
          id: sId,
          title: item.title,
          poster: item.posterPath,
          backdrop: item.backdropPath,
          mediaType: "tv",
          rating: item.rating ?? item.voteAverage ?? 0,
        },
        sNum,
        epNum,
      );
    } else {
      onSelectMedia({
        id: item.mediaId,
        title: item.title,
        poster: item.posterPath,
        backdrop: item.backdropPath,
        mediaType: item.mediaType as "movie" | "tv",
        rating: item.rating ?? item.voteAverage ?? 0,
        logo: item.logo,
      });
    }
  };

  const handleRemove = (e: React.MouseEvent, item: WatchlistItem) => {
    e.stopPropagation();
    onToggleWatchlist({
      id: item.mediaId,
      title: item.title,
      poster: item.posterPath,
      backdrop: item.backdropPath,
      mediaType: item.mediaType === "episode" ? "tv" : (item.mediaType as "movie" | "tv"),
      rating: item.rating ?? item.voteAverage ?? 0,
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#141518] text-white font-sans select-none">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <WatchlistGrid
          items={watchlist}
          onCardClick={handleCardClick}
          onRemove={handleRemove}
          onBrowse={() => onNavigateTab?.("movies")}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
