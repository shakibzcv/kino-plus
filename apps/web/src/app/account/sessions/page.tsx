"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import AuthModal from "../../../components/AuthModal";
import AccountSidebar from "../AccountSidebar";
import { useAuth } from "../../../context/AuthContext";
import { API_BASE_URL, getClientAccessToken } from "../../../lib/auth.client";

interface SessionItem {
  id: string;
  isCurrent: boolean;
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tv" | "browser";
  browser?: string;
  os?: string;
  ipAddress: string;
  location: string;
  lastActiveAt: string;
  createdAt: string;
}

const ITEMS_PER_PAGE = 3;

function parseUserAgent(ua?: string | null): {
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tv" | "browser";
} {
  const lower = (ua || "").toLowerCase();
  if (!lower) {
    return { deviceName: "Unknown Browser", deviceType: "browser" };
  }
  if (
    lower.includes("android tv") ||
    lower.includes("smart-tv") ||
    lower.includes("bravia") ||
    lower.includes("firetv")
  ) {
    return { deviceName: "Android TV", deviceType: "tv" };
  }
  if (lower.includes("iphone") || lower.includes("ipad")) {
    return {
      deviceName: lower.includes("ipad") ? "iPad" : "iPhone",
      deviceType: "mobile",
    };
  }
  if (lower.includes("android")) {
    return { deviceName: "Android Device", deviceType: "mobile" };
  }
  if (lower.includes("macintosh") || lower.includes("mac os")) {
    return { deviceName: "Mac / Safari", deviceType: "desktop" };
  }
  if (lower.includes("windows")) {
    return { deviceName: "Windows PC", deviceType: "desktop" };
  }
  return { deviceName: "Web Browser", deviceType: "browser" };
}

function SessionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Read page number from URL query, default to 1
  const pageParam = searchParams.get("page");
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalPages = Math.max(1, Math.ceil(totalSessions / ITEMS_PER_PAGE));

  const handleNavigatePage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages) return;
    router.push(`/account/sessions?page=${targetPage}`);
  };

  // Generate smart pagination page numbers with ellipsis support
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "ellipsis")[] = [];
    pages.push(1);

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) {
      pages.push("ellipsis");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push("ellipsis");
    }

    pages.push(totalPages);
    return pages;
  };

  // Fetch or slice sessions for the current page
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    const token = getClientAccessToken();

    if (token) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/auth/sessions?page=${currentPage}&limit=${ITEMS_PER_PAGE}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res.ok) {
          const json = await res.json();
          const apiData = json.data;

          if (apiData && (apiData.sessions?.length > 0 || apiData.current)) {
            const list: SessionItem[] = [];

            if (apiData.current && currentPage === 1) {
              const { deviceName, deviceType } = parseUserAgent(
                apiData.current.userAgent,
              );
              list.push({
                id: apiData.current.id,
                isCurrent: true,
                deviceName: `${deviceName} (This Device)`,
                deviceType,
                ipAddress: apiData.current.ipAddress || "Localhost",
                location: "Current active session",
                lastActiveAt: "Active now",
                createdAt: new Date(
                  apiData.current.createdAt || Date.now(),
                ).toLocaleDateString(),
              });
            }

            for (const s of apiData.sessions || []) {
              const { deviceName, deviceType } = parseUserAgent(s.userAgent);
              list.push({
                id: s.id,
                isCurrent: false,
                deviceName,
                deviceType,
                ipAddress: s.ipAddress || "Unknown IP",
                location: "Authorized Device",
                lastActiveAt: s.lastActiveAt
                  ? new Date(s.lastActiveAt).toLocaleString()
                  : "Recently active",
                createdAt: s.createdAt
                  ? new Date(s.createdAt).toLocaleDateString()
                  : "",
              });
            }

            setSessions(list);
            setTotalSessions(
              (apiData.total || 0) + (apiData.current ? 1 : 0),
            );
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("[Sessions] Failed to fetch live API sessions, using fallback:", err);
      }
    }

    // If API fetch returned nothing or failed, show authentic empty state
    setSessions([]);
    setTotalSessions(0);
    setIsLoading(false);
  }, [currentPage]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    const token = getClientAccessToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/sessions/${sessionId}`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Continue and update local state
      }
    }

    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast("Session terminated successfully");
  };

  const handleRevokeOtherSessions = async () => {
    const token = getClientAccessToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/sessions/revoke-others`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Continue
      }
    }

    setSessions((prev) => prev.filter((s) => s.isCurrent));
    showToast("All other active sessions have been signed out");
  };

  return (
    <div className="min-h-screen w-full bg-[#121316] text-white flex flex-col font-sans select-none pt-[57px]">
      <Header onOpenAuth={() => setIsAuthModalOpen(true)} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 md:py-12">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 lg:gap-12">
          {/* Left Sidebar Navigation */}
          <AccountSidebar activeTab="sessions" />

          {/* Right Main Content */}
          <section className="flex-1 min-w-0 md:pl-8 lg:pl-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  Sessions
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                  Manage active browser sessions and logged-in devices across your account.
                </p>
              </div>

              {sessions.some((s) => !s.isCurrent) && (
                <button
                  type="button"
                  onClick={handleRevokeOtherSessions}
                  className="self-start sm:self-auto px-4 py-2 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer whitespace-nowrap shadow-sm active:scale-95"
                >
                  Sign Out Other Sessions
                </button>
              )}
            </div>

            {/* Sessions Cards Container */}
            <div className="max-w-2xl flex flex-col space-y-3 sm:space-y-3.5">
              {isLoading ? (
                <div className="flex flex-col space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 bg-zinc-800/40 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-sm">
                  No active sessions found for this page.
                </div>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                      {/* Device Icon */}
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-zinc-300 border border-white/5 mt-0.5 sm:mt-0">
                        {sess.deviceType === "mobile" ? (
                          <svg
                            className="w-5 h-5 text-sky-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.8"
                              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        ) : sess.deviceType === "tv" ? (
                          <svg
                            className="w-5 h-5 text-amber-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.8"
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-[#f2545b]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.8"
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Device & Location Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white break-words">
                            {sess.deviceName}
                          </p>
                          {sess.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f2545b]/20 text-[#f2545b] border border-[#f2545b]/40 whitespace-nowrap">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="truncate max-w-[200px] sm:max-w-none">{sess.location}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-500 font-mono text-[11px]">{sess.ipAddress}</span>
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Last active: <span className="text-zinc-400">{sess.lastActiveAt}</span>
                        </p>
                      </div>
                    </div>

                    {/* Revoke Button for non-current sessions */}
                    {!sess.isCurrent && (
                      <div className="flex sm:block justify-end pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0">
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(sess.id)}
                          className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-red-400 bg-white/[0.03] sm:bg-transparent hover:bg-red-500/10 border border-white/5 sm:border-transparent transition-all cursor-pointer flex-shrink-0 text-center"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Fully Responsive Pagination Controls */}
            {totalPages > 1 && (
              <div className="max-w-2xl mt-7 sm:mt-8 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                {/* Status Counter */}
                <p className="text-xs text-zinc-500 order-2 sm:order-1 text-center sm:text-left">
                  Showing{" "}
                  <span className="text-zinc-300 font-medium">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>
                  –
                  <span className="text-zinc-300 font-medium">
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalSessions)}
                  </span>{" "}
                  of{" "}
                  <span className="text-zinc-300 font-medium">
                    {totalSessions}
                  </span>{" "}
                  sessions
                </p>

                {/* Pagination Controls Bar */}
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto order-1 sm:order-2">
                  {/* Previous Button */}
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => handleNavigatePage(currentPage - 1)}
                    aria-label="Go to previous page"
                    className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      currentPage <= 1
                        ? "text-zinc-600 border border-white/5 cursor-not-allowed opacity-40"
                        : "text-zinc-300 hover:text-white hover:bg-white/10 border border-zinc-700/60 active:scale-95 cursor-pointer"
                    }`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    <span>Prev</span>
                  </button>

                  {/* Desktop / Tablet Page Numbers */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {getPageNumbers().map((pageItem, idx) => {
                      if (pageItem === "ellipsis") {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="w-7 h-7 flex items-center justify-center text-xs text-zinc-500 select-none"
                          >
                            …
                          </span>
                        );
                      }
                      const isActive = pageItem === currentPage;
                      return (
                        <button
                          key={pageItem}
                          type="button"
                          onClick={() => handleNavigatePage(pageItem)}
                          className={`w-7 h-7 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                            isActive
                              ? "border border-zinc-500 bg-white/15 text-white shadow-sm"
                              : "text-zinc-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {pageItem}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile Compact Page Indicator */}
                  <div className="sm:hidden px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] font-semibold text-zinc-300">
                    {currentPage} / {totalPages}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => handleNavigatePage(currentPage + 1)}
                    aria-label="Go to next page"
                    className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      currentPage >= totalPages
                        ? "text-zinc-600 border border-white/5 cursor-not-allowed opacity-40"
                        : "text-zinc-300 hover:text-white hover:bg-white/10 border border-zinc-700/60 active:scale-95 cursor-pointer"
                    }`}
                  >
                    <span>Next</span>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e2026] border border-white/20 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#121316] text-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#f2545b] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SessionsContent />
    </Suspense>
  );
}
