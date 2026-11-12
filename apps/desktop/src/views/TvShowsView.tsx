import React, { useState, useEffect, useCallback } from "react";
import { MediaItem, WatchlistItem } from "../types";
import {
  fetchBingeShows,
  fetchRealityShows,
  fetchTvByCategory,
} from "../lib/api";
import MediaRail from "../components/MediaRail";

interface TvShowsViewProps {
  onSelectMedia: (item: MediaItem) => void;
  watchlist: WatchlistItem[];
  onToggleWatchlist: (item: MediaItem) => void;
  onPlay?: (item: MediaItem) => void;
}

export default function TvShowsView({
  onSelectMedia,
  watchlist,
  onToggleWatchlist,
  onPlay,
}: TvShowsViewProps): React.ReactElement {
  const [bingeShows, setBingeShows] = useState<MediaItem[]>([]);
  const [dramaShows, setDramaShows] = useState<MediaItem[]>([]);
  const [realityShows, setRealityShows] = useState<MediaItem[]>([]);
  const [comedyShows, setComedyShows] = useState<MediaItem[]>([]);
  const [actionShows, setActionShows] = useState<MediaItem[]>([]);
  const [crimeShows, setCrimeShows] = useState<MediaItem[]>([]);
  const [sciFiShows, setSciFiShows] = useState<MediaItem[]>([]);
  const [familyShows, setFamilyShows] = useState<MediaItem[]>([]);
  const [docShows, setDocShows] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        binge,
        drama,
        reality,
        comedy,
        action,
        crime,
        scifi,
        family,
        docs,
      ] = await Promise.all([
        fetchBingeShows(),
        fetchTvByCategory("drama"),
        fetchRealityShows(),
        fetchTvByCategory("comedy"),
        fetchTvByCategory("action"),
        fetchTvByCategory("crime"),
        fetchTvByCategory("fantasy"),
        fetchTvByCategory("family"),
        fetchTvByCategory("documentary"),
      ]);

      const markTvType = (list: MediaItem[]) =>
        list.map((item) => ({ ...item, mediaType: "tv" as const }));

      setBingeShows(markTvType(binge));
      setDramaShows(markTvType(drama));
      setRealityShows(markTvType(reality));
      setComedyShows(markTvType(comedy));
      setActionShows(markTvType(action));
      setCrimeShows(markTvType(crime));
      setSciFiShows(markTvType(scifi));
      setFamilyShows(markTvType(family));
      setDocShows(markTvType(docs));
    } catch (err) {
      console.error("Failed to load TV shows:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePlayMedia = (item: MediaItem) => {
    if (onPlay) onPlay(item);
    else onSelectMedia(item);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#18191c] text-white font-sans select-none overflow-y-auto">
      <main className="flex-1 w-full pt-6 sm:pt-8 pb-10">
        {/* Title Header */}
        <div className="px-4 sm:px-6 lg:px-8 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            TV Shows
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
            Binge-worthy series, reality sagas, and prestige television.
          </p>
        </div>

        <div className="space-y-2">
          {/* 1. Binge-Worthy Shows */}
          <MediaRail
            title="Binge-Worthy Shows"
            items={bingeShows}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlayMedia}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />

          {/* 2. Prestige Drama Series */}
          <MediaRail
            title="Prestige Drama Series"
            items={dramaShows}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlayMedia}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />

          {/* 3. Reality & Lifestyle TV */}
          <MediaRail
            title="Reality & Lifestyle TV"
            items={realityShows}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlayMedia}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />

          {/* 4. Hilarious Comedy Series */}
          <MediaRail
            title="Hilarious Comedy Series"
            items={comedyShows}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlayMedia}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />

          {/* 5. Action & Adventure Series */}
          <MediaRail
            title="Action & Adventure Series"
            items={actionShows}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlayMedia}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />

          {/* 6. Edge-of-Your-Seat Crime & Mystery */}
          <MediaRail
            title="Edge-of-Your-Seat Crime & Mystery"
            items={crimeShows}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlayMedia}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />

          {/* 7. Sci-Fi & Fantasy Series */}
          <MediaRail
            title="Sci-Fi & Fantasy Series"
            items={sciFiShows}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlayMedia}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />

          {/* 8. Family Favorites */}
          <MediaRail
            title="Family Favorites & Kids"
            items={familyShows}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlayMedia}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />

          {/* 9. Documentaries & Docuseries */}
          <MediaRail
            title="Fascinating Documentaries & Docuseries"
            items={docShows}
            isLoading={isLoading}
            onSelectMedia={onSelectMedia}
            onPlayMedia={handlePlayMedia}
            watchlist={watchlist}
            onToggleWatchlist={onToggleWatchlist}
          />
        </div>
      </main>
    </div>
  );
}

