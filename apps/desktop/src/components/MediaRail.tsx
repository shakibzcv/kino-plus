import React from "react";
import { MediaItem } from "../types";
import { MediaSlider as SharedMediaSlider } from "@repo/ui/media-slider";
import { fetchMediaLogo } from "../lib/api";
import { type RenderMediaImage } from "@repo/ui/media-card";

interface MediaRailProps {
  title: string;
  items: MediaItem[];
  isLoading?: boolean;
  onSelectMedia: (item: MediaItem) => void;
  onPlayMedia?: (item: MediaItem) => void;
  watchlist?: any[];
  onToggleWatchlist?: (item: MediaItem) => void;
}

const renderPlainImage: RenderMediaImage = (src, alt, fill) => (
  <img
    src={src}
    alt={alt}
    className={`object-cover object-center ${fill ? "w-full h-full" : ""}`}
    loading="lazy"
  />
);

export default function MediaRail(props: MediaRailProps): React.ReactElement {
  const SliderComponent = SharedMediaSlider as React.ComponentType<any>;
  return (
    <SliderComponent
      {...props}
      renderImage={renderPlainImage}
      fetchLogo={fetchMediaLogo}
    />
  );
}

