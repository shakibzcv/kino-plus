"use client";

import React, { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AuthModal from "../../components/AuthModal";
import { useAuth } from "../../context/AuthContext";
import AccountSidebar from "./AccountSidebar";

export default function AccountPage() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Dynamic user data without mock or dummy fallbacks
  const displayEmail = user?.email || "";
  const [name, setName] = useState(
    user?.name || (user?.email ? user.email.split("@")[0] : "") || "",
  );

  React.useEffect(() => {
    if (user?.name) {
      setName(user.name);
    } else if (user?.email) {
      setName(user.email.split("@")[0] || "");
    } else {
      setName("");
    }
  }, [user]);

  // Edit Name Modal
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState(name);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNameInput.trim()) {
      setName(newNameInput.trim());
      setIsEditingName(false);
      showToast("Name updated successfully");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#121316] text-white flex flex-col font-sans select-none pt-[57px]">
      <Header onOpenAuth={() => setIsAuthModalOpen(true)} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left Sidebar Navigation */}
          <AccountSidebar activeTab="account" />

          {/* Right Main Content */}
          <section className="flex-1 min-w-0 md:pl-10 lg:pl-14">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-8">
              Account
            </h1>

            {/* Account Settings Rows (Email and Name, no separators, compact spacing) */}
            <div className="max-w-2xl flex flex-col space-y-4 text-sm sm:text-[15px]">
              {/* Row 1: Email */}
              <div className="flex items-center justify-between gap-4">
                <span className="font-normal text-zinc-100">Email</span>
                <span className="text-zinc-400 font-normal select-all">
                  {displayEmail || "—"}
                </span>
              </div>

              {/* Row 2: Name */}
              <div
                onClick={() => {
                  setNewNameInput(name);
                  setIsEditingName(true);
                }}
                className="flex items-center justify-between gap-4 cursor-pointer group"
              >
                <span className="font-normal text-zinc-100 group-hover:text-white transition-colors">
                  Name
                </span>
                <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  <span>{name || (user?.email ? "Set Name" : "—")}</span>
                  <svg
                    className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors"
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
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* Edit Name Modal */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1b1d22] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-white mb-2">Edit Name</h2>
            <p className="text-xs text-zinc-400 mb-4">
              Enter your display name visible across Kino+.
            </p>
            <form onSubmit={handleSaveName}>
              <input
                type="text"
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                className="w-full bg-[#252830] text-white text-sm px-4 py-2.5 rounded-xl border border-white/10 focus:border-[#f2545b] focus:outline-none mb-4"
                placeholder="Enter name"
                autoFocus
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#f2545b] hover:bg-[#e0434b] text-white transition-all shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
