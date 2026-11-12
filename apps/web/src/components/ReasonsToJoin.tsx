import React from "react";

interface ReasonCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const reasons: ReasonCardProps[] = [
  {
    title: "Watch on Any Screen",
    description:
      "Stream effortlessly on Smart TVs, Playstation, Xbox, Chromecast, Apple TV, laptops, tablets, and phones.",
    icon: (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
      >
        <rect
          x="6"
          y="10"
          width="52"
          height="34"
          rx="5"
          stroke="url(#tvCoralGrad)"
          strokeWidth="3"
          fill="#1c1315"
        />
        <line
          x1="32"
          y1="44"
          x2="32"
          y2="52"
          stroke="url(#tvCoralGrad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="20"
          y1="52"
          x2="44"
          y2="52"
          stroke="url(#tvCoralGrad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="32" cy="27" r="6" fill="#f2545b" fillOpacity="0.3" />
        <path d="M30 24L36 27L30 30V24Z" fill="#f2545b" />
        <defs>
          <linearGradient
            id="tvCoralGrad"
            x1="6"
            y1="10"
            x2="58"
            y2="52"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#f2545b" />
            <stop offset="1" stopColor="#ff757b" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    title: "100+ Free Live Channels",
    description:
      "Switch on 24/7 live television channels broadcasting news, sports, action, comedy, anime, and movies.",
    icon: (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
      >
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="url(#liveCircleGrad)"
          stroke="url(#liveStrokeGrad)"
          strokeWidth="2.5"
        />
        <circle cx="32" cy="32" r="5" fill="#f2545b" />
        <path
          d="M23 23C27.9706 18.0294 36.0294 18.0294 41 23"
          stroke="#ff757b"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M17 17C25.2843 8.71573 38.7157 8.71573 47 17"
          stroke="#f2545b"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M23 41C27.9706 45.9706 36.0294 45.9706 41 41"
          stroke="#ff757b"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M17 47C25.2843 55.2843 38.7157 55.2843 47 47"
          stroke="#f2545b"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient
            id="liveCircleGrad"
            x1="12"
            y1="12"
            x2="52"
            y2="52"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#251316" />
            <stop offset="1" stopColor="#141518" />
          </linearGradient>
          <linearGradient
            id="liveStrokeGrad"
            x1="10"
            y1="10"
            x2="54"
            y2="54"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#f2545b" />
            <stop offset="1" stopColor="#cc3941" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    title: "14+ Deep Categories",
    description:
      "Explore deep genre hubs from high-octane Action and Sci-Fi to Documentaries, Crime, and En Español.",
    icon: (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
      >
        <rect
          x="10"
          y="10"
          width="18"
          height="18"
          rx="4"
          fill="url(#catGrad1)"
          stroke="#f2545b"
          strokeWidth="1.5"
        />
        <rect
          x="36"
          y="10"
          width="18"
          height="18"
          rx="4"
          fill="url(#catGrad2)"
          stroke="#ff757b"
          strokeWidth="1.5"
        />
        <rect
          x="10"
          y="36"
          width="18"
          height="18"
          rx="4"
          fill="url(#catGrad2)"
          stroke="#ff757b"
          strokeWidth="1.5"
        />
        <rect
          x="36"
          y="36"
          width="18"
          height="18"
          rx="4"
          fill="url(#catGrad1)"
          stroke="#f2545b"
          strokeWidth="1.5"
        />
        <circle cx="19" cy="19" r="3" fill="#f2545b" />
        <circle cx="45" cy="19" r="3" fill="#ff757b" />
        <circle cx="19" cy="45" r="3" fill="#ff757b" />
        <circle cx="45" cy="45" r="3" fill="#f2545b" />
        <defs>
          <linearGradient
            id="catGrad1"
            x1="10"
            y1="10"
            x2="28"
            y2="28"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#2b1418" />
            <stop offset="1" stopColor="#18191c" />
          </linearGradient>
          <linearGradient
            id="catGrad2"
            x1="36"
            y1="10"
            x2="54"
            y2="28"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#35161b" />
            <stop offset="1" stopColor="#18191c" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    title: "100% Free Forever",
    description:
      "Zero monthly subscriptions and no hidden fees. Stream unlimited movies, series, and live channels anytime.",
    icon: (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
      >
        <path
          d="M32 8L39.4 23.6L56 25.8L44 37.2L46.8 54L32 46L17.2 54L20 37.2L8 25.8L24.6 23.6L32 8Z"
          fill="url(#starGrad)"
          stroke="#f2545b"
          strokeWidth="2"
        />
        <circle cx="32" cy="32" r="7" fill="#18191c" />
        <path d="M30 28L36 32L30 36V28Z" fill="#f2545b" />
        <defs>
          <linearGradient
            id="starGrad"
            x1="8"
            y1="8"
            x2="56"
            y2="54"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#f2545b" />
            <stop offset="0.5" stopColor="#ff757b" />
            <stop offset="1" stopColor="#9e2a30" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
];

export default function ReasonsToJoin(): React.ReactElement {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-16 select-none">
      <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
        <span className="text-xs sm:text-sm font-semibold text-[#f2545b] uppercase tracking-wider mb-2">
          Why Kino+
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
          More Reasons to Stream on Kino+
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {reasons.map((reason, index) => (
          <div
            key={index}
            className="relative flex flex-col justify-between rounded-2xl p-6 sm:p-7 min-h-[200px] sm:min-h-[250px] bg-gradient-to-b from-[#1c1e24] via-[#16181d] to-[#111317] border border-white/5 shadow-xl hover:border-[#f2545b]/40 hover:shadow-2xl transition-all duration-300 group overflow-hidden"
          >
            {/* Top Content: Title & Description */}
            <div className="z-10">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug group-hover:text-[#f2545b] transition-colors">
                {reason.title}
              </h3>
              <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {reason.description}
              </p>
            </div>

            {/* Bottom Icon */}
            <div className="self-end mt-4 z-10 transform group-hover:scale-110 transition-transform duration-300">
              {reason.icon}
            </div>

            {/* Subtle deep coral glow effect behind card */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#f2545b]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#f2545b]/20 transition-all" />
          </div>
        ))}
      </div>
    </section>
  );
}
