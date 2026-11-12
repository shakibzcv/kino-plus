import React, { useEffect } from "react";

export interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  currentTime?: number;
  formatTime?: (secs: number) => string;
  onCopy: () => void;
  copiedToast: boolean;
  shareWithTimestamp: boolean;
  onToggleTimestamp: () => void;
}

export function ShareDialog({
  isOpen,
  onClose,
  shareUrl,
  currentTime = 0,
  formatTime,
  onCopy,
  copiedToast,
  shareWithTimestamp,
  onToggleTimestamp,
}: ShareDialogProps): React.ReactElement | null {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultFormatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formattedTime = formatTime ? formatTime(currentTime) : defaultFormatTime(currentTime);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#16181d] border border-white/10 rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span className="text-sm font-semibold text-white">Share</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Timestamp toggle */}
          {currentTime > 0 && (
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm text-white font-medium">Start at current time</p>
                <p className="text-xs text-zinc-500 mt-0.5">{formattedTime}</p>
              </div>
              <div
                className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                  shareWithTimestamp ? "bg-[#f2545b]" : "bg-zinc-700"
                }`}
                onClick={onToggleTimestamp}
              >
                <div
                  className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200 ${
                    shareWithTimestamp ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </div>
            </label>
          )}

          {/* URL display */}
          <div>
            <p className="text-xs text-zinc-500 mb-1.5 font-medium">Link</p>
            <div className="flex items-center gap-2 bg-[#0e1013] border border-white/10 rounded-lg px-3 py-2.5">
              <span className="flex-1 text-xs text-zinc-300 truncate font-mono select-all">
                {shareUrl}
              </span>
            </div>
          </div>

          {/* Copy button */}
          <button
            type="button"
            onClick={onCopy}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              copiedToast
                ? "bg-green-600/20 text-green-400 border border-green-500/30"
                : "bg-[#f2545b] hover:bg-[#e0434a] text-white"
            }`}
          >
            {copiedToast ? (
              <>
                <svg
                  className="w-4 h-4"
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
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
