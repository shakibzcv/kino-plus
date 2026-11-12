import React, { useEffect, useState, useCallback } from "react";

interface IntroAnimationProps {
  duration?: number;
  onComplete?: () => void;
}

const BRAND_CHARS = [
  { char: "k", isCoral: true },
  { char: "i", isCoral: false },
  { char: "n", isCoral: false },
  { char: "o", isCoral: false },
  { char: "+", isCoral: true, isPlus: true },
];

export default function IntroAnimation({
  duration = 2000,
  onComplete,
}: IntroAnimationProps): React.ReactElement | null {
  const [mounted, setMounted] = useState(false);
  const [startLetters, setStartLetters] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleFinish = useCallback(() => {
    setIsComplete(true);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  const dismissImmediately = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(handleFinish, 300);
  }, [handleFinish]);

  useEffect(() => {
    setMounted(true);

    const startTimer = setTimeout(() => {
      setStartLetters(true);
    }, 60);

    const fadeOutDelay = Math.max(800, duration - 400);
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, fadeOutDelay);

    const endTimer = setTimeout(() => {
      handleFinish();
    }, duration);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        dismissImmediately();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [duration, handleFinish, dismissImmediately]);

  if (!mounted || isComplete) {
    return null;
  }

  return (
    <div
      onClick={dismissImmediately}
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-[#0e1013] select-none cursor-pointer transition-opacity duration-400 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="Kino+ Intro Screen"
      role="banner"
    >
      <div className="flex items-baseline justify-center font-normal">
        {BRAND_CHARS.map((item, index) => {
          const delayMs = index * 110;
          return (
            <span
              key={index}
              style={{
                fontFamily: "'Rubik Marker Hatch', cursive, sans-serif",
                transition:
                  "transform 450ms cubic-bezier(0.34, 1.45, 0.64, 1), opacity 450ms cubic-bezier(0.25, 1, 0.5, 1)",
                transitionDelay: `${delayMs}ms`,
                transform: startLetters
                  ? "translateY(0) scale(1)"
                  : "translateY(35px) scale(0.4)",
                opacity: startLetters ? 1 : 0,
                textShadow: "0 3px 14px rgba(242, 84, 91, 0.35)",
              }}
              className={`inline-block leading-none tracking-[-0.03em] ${
                item.isCoral ? "text-[#f2545b]" : "text-white"
              } ${
                item.isPlus
                  ? "text-5xl sm:text-6xl md:text-7xl lg:text-8xl ml-1 sm:ml-1.5"
                  : "text-6xl sm:text-7xl md:text-8xl lg:text-9xl"
              }`}
            >
              {item.char}
            </span>
          );
        })}
      </div>
    </div>
  );
}
