import React from "react";

export interface KinoLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
  renderLink?: (content: any) => any;
}

export function KinoLogo({
  className = "",
  size = "md",
  onClick,
  renderLink,
}: KinoLogoProps): React.ReactElement {
  const sizeClasses = {
    sm: "text-2xl sm:text-[26px]",
    md: "text-[28px] sm:text-[32px]",
    lg: "text-4xl sm:text-[44px] md:text-[48px]",
    xl: "text-5xl sm:text-6xl md:text-7xl",
  };

  const content = (
    <span
      onClick={onClick}
      className={`inline-flex items-baseline lowercase select-none transition-all duration-300 leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] kino-wordmark ${sizeClasses[size]} ${className} ${
        onClick ? "cursor-pointer group-hover:scale-[1.03]" : ""
      }`}
      style={{
        fontFamily: "'Rubik Marker Hatch', cursive, sans-serif",
      }}
    >
      <span className="text-[#f2545b]">k</span>
      <span className="text-white">ino</span>
      <span className="text-[#f2545b] text-[0.8em] ml-[0.08em] leading-none">
        +
      </span>
    </span>
  );

  if (renderLink) {
    return <>{renderLink(content)}</>;
  }

  return content;
}
