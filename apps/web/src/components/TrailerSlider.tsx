"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TrailerItem } from "../lib/tmdb";
import { TrailerSlider as SharedTrailerSlider } from "@repo/ui/trailer-slider";
import { type RenderTrailerImage } from "@repo/ui/trailer-card";

interface TrailerSliderProps {
  title: string;
  items: TrailerItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const renderNextImage: RenderTrailerImage = (src, alt, fill) => (
  <Image
    src={src}
    alt={alt}
    fill={fill}
    sizes="(max-width: 640px) 200px, (max-width: 768px) 230px, (max-width: 1024px) 250px, 270px"
    className="object-cover object-center transition-opacity duration-300 group-hover/card:opacity-80"
    loading="lazy"
  />
);

export default function TrailerSlider({
  title,
  items,
  isLoading = false,
  error = null,
  onRetry,
}: TrailerSliderProps): React.ReactElement {
  const router = useRouter();

  const handlePlayTrailer = (item: any) => {
    if (item.linkUrl) {
      router.push(item.linkUrl);
    } else if (item.id) {
      router.push(`/movie/${item.id}`);
    }
  };

  const SliderComponent = SharedTrailerSlider as React.ComponentType<any>;

  return (
    <SliderComponent
      title={title}
      items={items}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      onPlayTrailer={handlePlayTrailer}
      renderImage={renderNextImage}
    />
  );
}
