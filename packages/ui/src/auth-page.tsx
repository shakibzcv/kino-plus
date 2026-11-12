import type { ReactNode } from "react";
import { LANDING_POSTERS, LandingPosterItem } from "./landing-posters";

// ─── Public API ───────────────────────────────────────────────────────────────
export type { LandingPosterItem };
export { LANDING_POSTERS };

/**
 * Platform-agnostic render function for a poster image.
 * Web uses Next.js <Image>, desktop uses <img>, mobile uses Expo <Image>.
 */
export type RenderPosterImage = (item: LandingPosterItem, index: number) => ReactNode;

export interface AuthPageLayoutProps {
  /** The brand logo element (e.g. KinoLogo component) */
  logo: ReactNode;
  /** The sign-in / auth action slot (button, spinner, error messages) */
  authAction: ReactNode;
  /** Optional custom image renderer. Defaults to an HTML <img> tag. */
  renderPosterImage?: RenderPosterImage;
  /**
   * Root height class.
   * Web: "h-screen" (fills browser viewport)
   * Desktop: "h-full" (fills flex parent below Electron titlebar)
   */
  heightClass?: string;
  /**
   * Main container max-width / sizing class.
   * Web: "max-w-7xl mx-auto"
   * Desktop: "w-full" (stretches to full window width)
   */
  containerClass?: string;
  /** Optional custom poster dataset (defaults to LANDING_POSTERS) */
  posters?: LandingPosterItem[];
}

/**
 * Shared AuthPage layout used across platforms.
 *
 * Renders the full authentication view:
 * - Subtle ambient radial glow
 * - Left column: Brand logo, high-impact headline, subheadings, and platform-specific auth actions
 * - Right column: Dynamic vertical waterfall marquee of movie posters (no border on poster cards)
 */
export function AuthPageLayout({
  logo,
  authAction,
  renderPosterImage,
  heightClass = "h-full",
  containerClass = "w-full",
  posters = LANDING_POSTERS,
}: AuthPageLayoutProps) {
  // 3 poster column slices for continuous infinite vertical waterfall
  const col1 = posters.slice(0, 7);
  const col2 = posters.slice(7, 14);
  const col3 = posters.slice(14, 20);

  const defaultRenderImage: RenderPosterImage = (item, idx) => (
    <img
      src={item.poster}
      alt={item.title}
      className="w-full h-full object-cover object-center pointer-events-none"
      loading={idx < 3 ? "eager" : "lazy"}
    />
  );

  const renderImage = renderPosterImage ?? defaultRenderImage;

  const renderColumn = (
    items: LandingPosterItem[],
    animationClass: string,
    extraWrapperClass = "",
  ) => {
    const infiniteItems = [...items, ...items];
    return (
      <div
        className={`relative flex flex-col gap-3.5 sm:gap-4 overflow-hidden select-none bg-transparent ${extraWrapperClass}`}
      >
        <div
          className={`flex flex-col gap-3.5 sm:gap-4 ${animationClass} hover:[animation-play-state:paused]`}
        >
          {infiniteItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="relative w-[120px] sm:w-[140px] md:w-[150px] lg:w-[165px] xl:w-[180px] aspect-[2/3] shrink-0 rounded-xl overflow-hidden shadow-xl select-none bg-zinc-900"
            >
              {renderImage(item, idx)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative w-full ${heightClass} bg-[#0e1013] overflow-hidden flex items-center justify-center`}
    >
      {/* Background ambient radial glow */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full bg-[#f2545b]/10 blur-[150px] pointer-events-none transform -translate-x-1/4 -translate-y-12"
        aria-hidden="true"
      />

      {/* Auth page split layout */}
      <main
        className={`relative z-10 flex items-center ${containerClass} px-6 sm:px-10 lg:px-16 xl:px-20 w-full h-full overflow-hidden`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center w-full h-full py-4">

          {/* Left Column — Brand, Headline, CTA */}
          <div className="md:col-span-6 relative flex flex-col items-start text-left z-10 justify-center min-w-0">
            {/* Logo slot */}
            <div className="mb-6 sm:mb-8">{logo}</div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
              Endless Movies, Series &amp;
              <br />
              <span className="bg-gradient-to-r from-[#f2545b] via-[#ff757b] to-[#f2545b] bg-clip-text text-transparent">
                Blockbusters
              </span>
            </h1>

            {/* Description */}
            <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-zinc-300 font-medium leading-relaxed max-w-lg drop-shadow">
              Stream thousands of blockbusters and binge-worthy series on any screen, anytime.
            </p>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400">
              Instant streaming on any screen. Sign in to start watching.
            </p>

            {/* Auth action slot */}
            <div className="mt-6 sm:mt-8 flex flex-col items-start w-full sm:w-auto">
              {authAction}
            </div>
          </div>

          {/* Right Column — Poster Waterfall Marquee */}
          <div
            className="md:col-span-6 relative w-full h-[480px] sm:h-[540px] md:h-[82vh] lg:h-[86vh] overflow-hidden bg-transparent"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
            }}
          >
            <div className="flex gap-3 sm:gap-4 lg:gap-5 justify-center h-full bg-transparent">
              {renderColumn(col1, "animate-marquee-down")}
              {renderColumn(col2, "animate-marquee-up")}
              {renderColumn(col3, "animate-marquee-down-slow", "hidden sm:flex")}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Aliases for intuitive naming
export { AuthPageLayout as AuthPage };
export type { AuthPageLayoutProps as AuthPageProps };
