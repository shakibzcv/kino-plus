"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  getWatchProviders,
  type WatchProvidersResponse,
  type WatchProviderItem,
} from "../lib/tmdb";

interface WatchProvidersProps {
  mediaId: string | number;
  mediaType: "movie" | "tv";
  variant?: "full" | "compact";
}

export default function WatchProviders({
  mediaId,
  mediaType,
  variant = "full",
}: WatchProvidersProps) {
  const [data, setData] = useState<WatchProvidersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getWatchProviders(mediaId, mediaType)
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mediaId, mediaType]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2.5 py-4 text-xs text-zinc-400">
        <div className="w-4 h-4 border-2 border-[#f2545b] border-t-transparent rounded-full animate-spin" />
        <span>Loading streaming availability...</span>
      </div>
    );
  }

  const streaming = data?.streaming || [];
  const stores = data?.stores || [];
  const hasAny = streaming.length > 0 || stores.length > 0;

  if (!hasAny) {
    return (
      <div className="py-4 text-zinc-500 text-xs">
        No official streaming or digital purchase options currently listed for this title.
      </div>
    );
  }

  const renderBadge = (item: WatchProviderItem) => (
    <a
      key={`${item.id}-${item.category}`}
      href={data?.link || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 transition-all duration-150 cursor-pointer"
      title={`Watch on ${item.name}`}
    >
      <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-black/40 shrink-0 border border-white/10">
        {item.logo ? (
          <Image
            src={item.logo}
            alt={item.name}
            fill
            sizes="32px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 font-bold">
            {item.name.slice(0, 2)}
          </div>
        )}
      </div>

      <div className="min-w-0 pr-1">
        <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate max-w-[130px]">
          {item.name}
        </p>
        <p className="text-[10px] text-zinc-500 truncate max-w-[130px]">
          {item.regionLabel}
        </p>
      </div>
    </a>
  );

  return (
    <div className="w-full space-y-5">
      {/* 1. Subscription & Free Streams */}
      {streaming.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-400">
              Stream
            </h4>

          </div>

          <div className="flex flex-wrap gap-2.5">
            {streaming.map(renderBadge)}
          </div>
        </div>
      )}

      {/* 2. Rent / Buy Digital Stores */}
      {stores.length > 0 && variant === "full" && (
        <div className="pt-2">
          <h4 className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-400 mb-3">
            Rent or Buy
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {stores.slice(0, 10).map(renderBadge)}
          </div>
        </div>
      )}
    </div>
  );
}
