import React from "react";
import { MediaItem } from "../types";
import { fetchMediaLogo } from "../lib/api";
import { MediaCard as SharedMediaCard, type RenderMediaImage } from "@repo/ui/media-card";

interface MediaCardProps {
  item: MediaItem;
  onClick: (item: MediaItem) => void;
  onPlay?: (item: MediaItem) => void;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (item: MediaItem) => void;
  expandOnHover?: boolean;
}

const renderPlainImage: RenderMediaImage = (src, alt, fill) => (
  <img
    src={src}
    alt={alt}
    className={`object-cover object-center ${fill ? "w-full h-full" : ""}`}
    loading="lazy"
  />
);

export default function MediaCard({
  item,
  onClick,
  isWatchlisted = false,
  onToggleWatchlist,
  expandOnHover = true,
}: MediaCardProps): React.ReactElement {
  const handleCardClick = () => {
    onClick(item);
  };

  const handleToggleWatchlist = () => {
    onToggleWatchlist?.(item);
  };

  const CardComponent = SharedMediaCard as React.ComponentType<any>;

  return (
    <CardComponent
      item={item as any}
      onClick={handleCardClick}
      isWatchlisted={isWatchlisted}
      onToggleWatchlist={onToggleWatchlist ? handleToggleWatchlist : undefined}
      expandOnHover={expandOnHover}
      renderImage={renderPlainImage}
      fetchLogo={fetchMediaLogo}
    />
  );
}
