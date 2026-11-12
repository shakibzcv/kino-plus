import React from "react";
import { TrailerItem } from "../types";
import { TrailerSlider as SharedTrailerSlider } from "@repo/ui/trailer-slider";
import { type RenderTrailerImage } from "@repo/ui/trailer-card";

interface TrailerSliderProps {
  title: string;
  items: TrailerItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onPlayTrailer?: (item: TrailerItem) => void;
}

const renderPlainImage: RenderTrailerImage = (src, alt, fill) => (
  <img
    src={src}
    alt={alt}
    className={`object-cover object-center ${fill ? "w-full h-full" : ""}`}
    loading="lazy"
  />
);

export default function TrailerSlider(props: TrailerSliderProps): React.ReactElement {
  const SliderComponent = SharedTrailerSlider as React.ComponentType<any>;
  return <SliderComponent {...props} renderImage={renderPlainImage} />;
}

