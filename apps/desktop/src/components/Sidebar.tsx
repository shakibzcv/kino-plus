import React from "react";
import { UserProfile } from "../types";
import {
  HomeIcon,
  FilmIcon,
  TvIcon,
  AnimeIcon,
  GridIcon,
  BookmarkIcon,
} from "./Icons";

export type NavTabId =
  | "home"
  | "movies"
  | "tv-shows"
  | "anime"
  | "categories"
  | "watchlist"
  | "profile";

export const SIDEBAR_ITEMS: { id: NavTabId; label: string; icon: React.FC<any> }[] = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "movies", label: "Movies", icon: FilmIcon },
  { id: "tv-shows", label: "TV Shows", icon: TvIcon },
  { id: "anime", label: "Anime", icon: AnimeIcon },
  { id: "categories", label: "Categories", icon: GridIcon },
  { id: "watchlist", label: "Watchlist", icon: BookmarkIcon },
];

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  user: UserProfile | null;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  user,
}: SidebarProps): React.ReactElement {
  return (
    <aside className="w-14 h-full bg-[#0b0d10] border-r border-white/[0.05] flex flex-col items-center py-3 justify-between flex-shrink-0 z-40 select-none">
      <button
        type="button"
        onClick={() => onSelectTab("home")}
        className="titlebar-no-drag mb-3 cursor-pointer"
        title="Kino+ Home"
      >
        <span className="kino-font text-xl leading-none inline-flex items-baseline">
          <span className="text-[#f2545b]">k</span>
          <span className="text-white text-[0.8em] ml-[0.05em]">+</span>
        </span>
      </button>

      <nav className="titlebar-no-drag flex flex-col items-center gap-1 flex-1 w-full">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              className={`relative group w-full h-10 flex items-center justify-center cursor-pointer ${
                isActive ? "text-[#f2545b]" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="absolute left-14 px-2 py-0.5 bg-[#16181d] text-[11px] text-zinc-200 opacity-0 pointer-events-none group-hover:opacity-100 z-50 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="titlebar-no-drag pt-2">
        <button
          type="button"
          onClick={() => onSelectTab("profile")}
          title={user?.name ? `${user.name} (Account & Sessions)` : "Account & Sessions"}
          className={`relative group w-8 h-8 flex items-center justify-center cursor-pointer ${
            activeTab === "profile" ? "opacity-100" : "opacity-80 hover:opacity-100"
          }`}
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || "Profile"}
              className={`w-7 h-7 rounded-full object-cover ${
                activeTab === "profile" ? "outline outline-1 outline-[#f2545b]" : ""
              }`}
            />
          ) : (
            <div
              className={`w-7 h-7 rounded-full bg-zinc-700 text-zinc-200 text-[11px] flex items-center justify-center ${
                activeTab === "profile" ? "outline outline-1 outline-[#f2545b]" : ""
              }`}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <span className="absolute left-14 px-2 py-0.5 bg-[#16181d] text-[11px] text-zinc-200 opacity-0 pointer-events-none group-hover:opacity-100 z-50 whitespace-nowrap">
            Account & Sessions
          </span>
        </button>
      </div>
    </aside>
  );
}
