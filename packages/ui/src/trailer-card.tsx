import React, { ReactNode } from "react";

export interface SharedTrailerItem {
  id: string | number;
  title: string;
  subtitle: string;
  thumbnail: string;
  isHighlight?: boolean;
}

export type RenderTrailerImage = (src: string, alt: string, fill?: boolean) => ReactNode;

interface TrailerCardProps {
  item: SharedTrailerItem;
  onClick: (item: SharedTrailerItem) => void;
  renderImage: RenderTrailerImage;
}

export function TrailerCard({
  item,
  onClick,
  renderImage,
}: TrailerCardProps): React.ReactElement {
  return (
    <div
      onClick={() => onClick(item)}
      className="flex-shrink-0 w-[200px] sm:w-[230px] md:w-[250px] lg:w-[270px] cursor-pointer group/card"
    >
      {/* Landscape Thumbnail Container */}
      <div className="relative w-full aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-zinc-900 shadow-md group-hover/card:shadow-xl transition-all duration-300">
        <div className="absolute inset-0">
          {renderImage(item.thumbnail, item.title, true)}
        </div>

        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Bottom-left play icon and play text — fades in on hover, matching Continue Watching */}
        <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-150 flex items-center gap-1.5 z-10">
          <svg className="w-3.5 h-3.5 fill-white drop-shadow" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span className="text-[11px] font-semibold text-white drop-shadow">
            Play
          </span>
        </div>
      </div>

      {/* Trailer Title */}
      <div className="mt-2 text-xs sm:text-sm text-white font-semibold px-0.5 truncate group-hover/card:text-[#f2545b] transition-colors">
        {item.title}
      </div>

      {/* Release Subtitle (with Highlight support) */}
      <div
        className={`text-[11px] sm:text-xs px-0.5 truncate mt-0.5 ${
          item.isHighlight
            ? "text-amber-400 font-bold"
            : "text-zinc-400 font-medium"
        }`}
      >
        {item.subtitle}
      </div>
    </div>
  );
}
