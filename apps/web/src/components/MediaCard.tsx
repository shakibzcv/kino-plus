"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TrendingMovie, getMediaLogo } from "../lib/tmdb";
import { useUserData } from "../context/UserDataContext";
import { MediaCard as SharedMediaCard, type RenderMediaImage } from "@repo/ui/media-card";

interface MediaCardProps {
  item: TrendingMovie;
  expandOnHover?: boolean;
}

const renderNextImage: RenderMediaImage = (src, alt, fill, options) => {
  const isBackdrop = options?.isBackdrop;
  const sizes =
    options?.sizes ||
    (isBackdrop
      ? "(max-width: 640px) 450px, (max-width: 768px) 520px, 600px"
      : "(max-width: 640px) 160px, (max-width: 768px) 190px, 220px");

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={fill ? sizes : undefined}
      quality={options?.quality || (isBackdrop ? 90 : 80)}
      className="object-cover object-center"
      loading="lazy"
      unoptimized={src.startsWith("http")}
    />
  );
};

export default function MediaCard({
  item,
  expandOnHover = true,
}: MediaCardProps): React.ReactElement {
  const router = useRouter();
  const { isInWatchlist, toggleWatchlist } = useUserData();
  const mediaType = (item.mediaType || "movie") as "movie" | "tv";
  const isWatchlisted = isInWatchlist(mediaType, item.id);

  const handleCardClick = (clickedItem: any) => {
    const detailsUrl = clickedItem.mediaType === "tv" ? `/tv/${clickedItem.id}` : `/movie/${clickedItem.id}`;
    router.push(detailsUrl);
  };

  const handleToggleWatchlist = (clickedItem: any) => {
    toggleWatchlist({
      mediaId: clickedItem.id,
      mediaType: clickedItem.mediaType || "movie",
      title: clickedItem.title,
      posterPath: clickedItem.poster,
      backdropPath: clickedItem.backdrop,
      logoPath: clickedItem.logo,
      logo: clickedItem.logo,
      overview: clickedItem.overview,
      rating: clickedItem.rating,
      voteAverage: clickedItem.rating,
      category: (clickedItem as any).category,
    });
  };

  return (
    <SharedMediaCard
      item={item as any}
      onClick={handleCardClick}
      isWatchlisted={isWatchlisted}
      onToggleWatchlist={handleToggleWatchlist}
      expandOnHover={expandOnHover}
      renderImage={renderNextImage}
      fetchLogo={getMediaLogo}
    />
  );
}
