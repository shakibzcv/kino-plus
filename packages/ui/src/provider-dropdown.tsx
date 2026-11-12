import React, { useRef, useEffect } from "react";

export interface ProviderItem {
  id: string;
  name: string;
}

export interface ProviderDropdownProps {
  providers: ProviderItem[];
  selectedProviderId: string;
  onSelectProvider: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  menuPlacement?: "top" | "bottom";
}

export function ProviderDropdown({
  providers,
  selectedProviderId,
  onSelectProvider,
  isOpen,
  onToggle,
  onClose,
  menuPlacement = "bottom",
}: ProviderDropdownProps): React.ReactElement | null {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!providers || providers.length === 0) {
    return null;
  }

  const activeProvider =
    providers.find((p) => p.id === selectedProviderId) || providers[0] || { id: "default", name: "Default" };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
          isOpen
            ? "bg-[#f2545b]/15 text-white"
            : "bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white"
        }`}
      >
        <svg
          className="w-3.5 h-3.5 text-[#f2545b]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
        <span className="font-semibold">{activeProvider.name}</span>
        <svg
          className={`w-3 h-3 text-zinc-400 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${
            menuPlacement === "top"
              ? "bottom-full mb-2 origin-bottom"
              : "top-full mt-2 origin-top"
          } right-0 w-[220px] bg-[#16181d] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50`}
        >
          <div
            className="max-h-[260px] sm:max-h-[300px] overflow-y-auto overscroll-contain space-y-1 no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onWheel={(e) => e.stopPropagation()}
          >
            {providers.map((p) => {
              const isSelected = p.id === selectedProviderId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectProvider(p.id);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-[#f2545b]/15 text-white font-semibold"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  {isSelected && (
                    <svg
                      className="w-3.5 h-3.5 text-[#f2545b] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
