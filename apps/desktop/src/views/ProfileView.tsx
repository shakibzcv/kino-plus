import React, { useState, useEffect, useCallback } from "react";
import { UserProfile, SessionItem } from "../types";
import { fetchUserSessions, revokeSession, revokeOtherSessions } from "../lib/api";

interface ProfileViewProps {
  user: UserProfile;
  onSignOut: () => void;
  onUpdateName?: (newName: string) => void;
}

const ITEMS_PER_PAGE = 3;

export default function ProfileView({ user, onSignOut, onUpdateName }: ProfileViewProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"account" | "sessions">("account");
  const displayEmail = user?.email || "";
  const [name, setName] = useState(user?.name || (user?.email ? user.email.split("@")[0] : "") || "");

  useEffect(() => {
    if (user?.name) setName(user.name);
    else if (user?.email) setName(user.email.split("@")[0] || "");
    else setName("");
  }, [user]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState(name);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };
  const totalPages = Math.max(1, Math.ceil(totalSessions / ITEMS_PER_PAGE));

  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "ellipsis")[] = [];
    pages.push(1);
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push("ellipsis");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  };

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const data = await fetchUserSessions(currentPage, ITEMS_PER_PAGE);
      setSessions(data.sessions);
      setTotalSessions(data.total);
    } catch (err) {
      console.warn("[Sessions] Failed to load sessions:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [currentPage]);

  useEffect(() => { if (activeTab === "sessions") loadSessions(); }, [activeTab, loadSessions]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNameInput.trim()) {
      const updated = newNameInput.trim();
      setName(updated);
      if (onUpdateName) onUpdateName(updated);
      setIsEditingName(false);
      showToast("Name updated successfully");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    await revokeSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setTotalSessions((prev) => Math.max(0, prev - 1));
    showToast("Session terminated successfully");
  };

  const handleRevokeOtherSessions = async () => {
    await revokeOtherSessions();
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setTotalSessions(1);
    showToast("All other active sessions have been signed out");
  };

  const handleNavigatePage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages) return;
    setCurrentPage(targetPage);
  };

  return (
    <div className="w-full h-full bg-[#121316] text-white flex flex-col font-sans select-none overflow-y-auto">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left Sidebar */}
          <aside className="w-full md:w-56 lg:w-60 flex-shrink-0 md:border-r md:border-[#26282e] md:pr-6 lg:pr-8 pb-3.5 md:pb-0 border-b border-[#26282e]/50 md:border-b-0">
            <nav className="flex flex-row md:flex-col gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
              <button type="button" onClick={() => setActiveTab("account")}
                className={`text-left text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap self-start ${activeTab === "account" ? "border border-zinc-600 rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-white bg-white/5 shadow-sm" : "px-4 sm:px-5 py-1.5 sm:py-2 text-zinc-400 hover:text-white"}`}>
                Account
              </button>
              <button type="button" onClick={() => setActiveTab("sessions")}
                className={`text-left text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap self-start ${activeTab === "sessions" ? "border border-zinc-600 rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-white bg-white/5 shadow-sm" : "px-4 sm:px-5 py-1.5 sm:py-2 text-zinc-400 hover:text-white"}`}>
                Sessions
              </button>
              <button type="button" onClick={() => setIsSignOutConfirmOpen(true)}
                className="text-left text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap self-start px-4 sm:px-5 py-1.5 sm:py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full">
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Right Main Content */}
          <section className="flex-1 min-w-0 md:pl-10 lg:pl-14">
            {activeTab === "account" ? (
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-8">Account</h1>
                <div className="max-w-2xl flex flex-col space-y-4 text-sm sm:text-[15px]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-normal text-zinc-100">Email</span>
                    <span className="text-zinc-400 font-normal select-all">{displayEmail || "—"}</span>
                  </div>
                  <div onClick={() => { setNewNameInput(name); setIsEditingName(true); }} className="flex items-center justify-between gap-4 cursor-pointer group">
                    <span className="font-normal text-zinc-100 group-hover:text-white transition-colors">Name</span>
                    <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                      <span>{name || (user?.email ? "Set Name" : "—")}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">Sessions</h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">Manage active browser sessions and logged-in devices across your account.</p>
                  </div>
                  {sessions.some((s) => !s.isCurrent) && (
                    <button type="button" onClick={handleRevokeOtherSessions}
                      className="self-start sm:self-auto px-4 py-2 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer whitespace-nowrap shadow-sm active:scale-95">
                      Sign Out Other Sessions
                    </button>
                  )}
                </div>

                <div className="max-w-2xl flex flex-col space-y-3 sm:space-y-3.5">
                  {isLoadingSessions ? (
                    <div className="flex flex-col space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-zinc-800/40 rounded-xl animate-pulse" />)}
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 text-sm">No active sessions found for this page.</div>
                  ) : (
                    sessions.map((sess) => (
                      <div key={sess.id} className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-zinc-300 border border-white/5 mt-0.5 sm:mt-0">
                            {sess.deviceType === "mobile" ? (
                              <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            ) : (
                              <svg className="w-5 h-5 text-[#f2545b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-white break-words">{sess.deviceName}</p>
                              {sess.isCurrent && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f2545b]/20 text-[#f2545b] border border-[#f2545b]/40 whitespace-nowrap">Current</span>}
                            </div>
                            <p className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="truncate max-w-[200px] sm:max-w-none">{sess.location}</span>
                              <span className="text-zinc-600">•</span>
                              <span className="text-zinc-500 font-mono text-[11px]">{sess.ipAddress}</span>
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-1">Last active: <span className="text-zinc-400">{sess.lastActiveAt}</span></p>
                          </div>
                        </div>
                        {!sess.isCurrent && (
                          <div className="flex sm:block justify-end pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0">
                            <button type="button" onClick={() => handleRevokeSession(sess.id)}
                              className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-red-400 bg-white/[0.03] sm:bg-transparent hover:bg-red-500/10 border border-white/5 sm:border-transparent transition-all cursor-pointer flex-shrink-0 text-center">
                              Sign Out
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="max-w-2xl mt-7 sm:mt-8 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <p className="text-xs text-zinc-500 order-2 sm:order-1 text-center sm:text-left">
                      Showing <span className="text-zinc-300 font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>–<span className="text-zinc-300 font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, totalSessions)}</span> of <span className="text-zinc-300 font-medium">{totalSessions}</span> sessions
                    </p>
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto order-1 sm:order-2">
                      <button type="button" onClick={() => handleNavigatePage(currentPage - 1)} disabled={currentPage <= 1}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        <span>Previous</span>
                      </button>
                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((p, index) =>
                          p === "ellipsis" ? (
                            <span key={`ellipsis-${index}`} className="px-2 py-1 text-xs text-zinc-600 select-none">…</span>
                          ) : (
                            <button key={`page-${p}`} type="button" onClick={() => handleNavigatePage(p)}
                              className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${currentPage === p ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
                              {p}
                            </button>
                          )
                        )}
                      </div>
                      <button type="button" onClick={() => handleNavigatePage(currentPage + 1)} disabled={currentPage >= totalPages}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1">
                        <span>Next</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Edit Name Modal */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1b1d22] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Edit Name</h2>
            <p className="text-xs text-zinc-400 mb-4">Enter your display name visible across Kino+.</p>
            <form onSubmit={handleSaveName}>
              <input type="text" value={newNameInput} onChange={(e) => setNewNameInput(e.target.value)}
                className="w-full bg-[#252830] text-white text-sm px-4 py-2.5 rounded-xl border border-white/10 focus:border-[#f2545b] focus:outline-none mb-4"
                placeholder="Enter name" autoFocus />
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsEditingName(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#f2545b] hover:bg-[#e0434b] text-white transition-all shadow-md cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {isSignOutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#18191c] border border-zinc-700/60 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#f2545b] flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Sign Out?</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">Are you sure you want to sign out of your Kino+ account?</p>
            <div className="flex justify-end gap-2.5">
              <button type="button" onClick={() => setIsSignOutConfirmOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-transparent hover:bg-white/5 transition-colors cursor-pointer">Cancel</button>
              <button type="button" onClick={() => { setIsSignOutConfirmOpen(false); onSignOut(); }} className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f2545b] hover:bg-[#ff656c] text-white transition-colors cursor-pointer shadow-md">Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e2026] border border-white/20 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl">{toastMessage}</div>
      )}
    </div>
  );
}
