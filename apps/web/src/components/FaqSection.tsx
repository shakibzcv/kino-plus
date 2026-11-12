"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  onOpenAuthModal?: () => void;
}

const faqs: FaqItem[] = [
  {
    question: "What is Kino+?",
    answer:
      "Kino+ is a premier free streaming platform offering thousands of on-demand movies, binge-worthy series, and 100+ live television channels across all your devices without any monthly fees.\n\nEnjoy action blockbusters, award-winning dramas, comedies, documentaries, and 24/7 live networks anytime you want.",
  },
  {
    question: "How much does Kino+ cost?",
    answer:
      "Kino+ is 100% free with no monthly subscriptions and no hidden fees. Simply sign in with Google and start streaming immediately.",
  },
  {
    question: "What can I watch on Live TV?",
    answer:
      "Kino+ Live TV features over 100 channels streaming 24/7 across news, sports, blockbuster action, retro classics, anime, and lifestyle. An interactive electronic program guide lets you browse what's playing now and next seamlessly.",
  },
  {
    question: "Where can I watch Kino+?",
    answer:
      "Watch anywhere, anytime. Stream instantly in your browser on desktop, laptop, tablet, or smartphone. Kino+ works smoothly across all modern web browsers and screens.",
  },
  {
    question: "Do I need an account to watch?",
    answer:
      "No account is required to start watching! However, signing in with Google unlocks custom watchlists, resume playback across your devices, and personalized recommendations.",
  },
  {
    question: "Is Kino+ safe for kids and families?",
    answer:
      "Yes! Kino+ features dedicated family and kids categories, animated favorites, and family-friendly movies so viewers of all ages have entertainment they can enjoy together.",
  },
];

export default function FaqSection({
  onOpenAuthModal,
}: FaqSectionProps): React.ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { loginWithGoogle, isAuthenticated } = useAuth();

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-16 select-none">
      <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
        <span className="text-xs sm:text-sm font-semibold text-[#f2545b] uppercase tracking-wider mb-2">
          Got Questions?
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
          Frequently Asked Questions
        </h2>
      </div>

      {/* FAQ Accordion List */}
      <div className="flex flex-col gap-2.5 max-w-4xl mx-auto">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-white/5 bg-[#18191c] transition-colors"
            >
              {/* Question Bar */}
              <button
                type="button"
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 hover:bg-[#202228] transition-colors duration-200 text-left cursor-pointer group"
              >
                <span className="text-base sm:text-lg md:text-xl font-medium text-white group-hover:text-[#f2545b] transition-colors pr-2">
                  {faq.question}
                </span>

                {/* Plus / Close Icon */}
                <div
                  className={`transform transition-transform duration-300 ${
                    isOpen
                      ? "rotate-45 text-[#f2545b]"
                      : "rotate-0 text-zinc-400 group-hover:text-white"
                  } shrink-0 ml-2 sm:ml-4`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6 sm:w-7 sm:h-7"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </div>
              </button>

              {/* Collapsible Answer Drawer */}
              {isOpen && (
                <div className="bg-[#141518] p-4 sm:p-6 md:p-7 text-sm sm:text-base md:text-lg text-zinc-300 leading-relaxed whitespace-pre-line border-t border-white/5 animate-fadeIn">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Call to Action */}
      <div className="mt-12 sm:mt-16 text-center max-w-2xl mx-auto flex flex-col items-center">
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Ready to Start Streaming?
        </h3>
        <p className="mt-2 text-sm sm:text-base text-zinc-300">
          Sign in with Google to sync your watchlist, or start watching 100+
          live channels instantly.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {!isAuthenticated && (
            <button
              type="button"
              onClick={loginWithGoogle}
              className="inline-flex items-center gap-3 bg-white hover:bg-zinc-100 active:scale-95 text-zinc-900 font-bold px-6 py-3 rounded-full text-sm sm:text-base transition-all shadow-lg hover:shadow-white/10 cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
