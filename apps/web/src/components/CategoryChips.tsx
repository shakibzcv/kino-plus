"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCategories, CategoryItem } from "../lib/tmdb";

interface CategoryChipsProps {
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string;
  categories?: CategoryItem[];
  showHeading?: boolean;
}

export default function CategoryChips({
  onSelectCategory,
  selectedCategory = "",
  categories: initialCategories,
  showHeading = true,
}: CategoryChipsProps): React.ReactElement | null {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [categoryList, setCategoryList] = useState<CategoryItem[]>(
    initialCategories || [],
  );

  // Fetch categories from the Express API if not provided in props
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategoryList(initialCategories);
      return;
    }

    let isMounted = true;
    async function loadCategories() {
      try {
        const fetched = await getCategories();
        if (isMounted && fetched && fetched.length > 0) {
          setCategoryList(fetched);
        }
      } catch (err) {
        console.warn("Failed to fetch categories from API:", err);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, [initialCategories]);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categoryList]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 350);
  };

  const handleChipClick = (categoryName: string) => {
    if (onSelectCategory) {
      onSelectCategory(categoryName);
    } else {
      router.push(`/category?name=${encodeURIComponent(categoryName)}`);
    }
  };

  if (!categoryList || categoryList.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-8 relative select-none group">
      {/* Section Header */}
      {showHeading && (
        <div className="flex items-center gap-1.5 mb-3 px-4 sm:px-6 lg:px-8">
          <h2
            onClick={() => router.push("/categories")}
            className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-1.5 cursor-pointer hover:text-zinc-200 transition-colors"
          >
            Browse Movies & TV Shows
            <svg
              className="w-4 h-4 text-zinc-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 inline"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </h2>
        </div>
      )}

      {/* Horizontal Slider Area with Hover Arrows */}
      <div className="relative w-full">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll categories left"
            className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-[#18191c]/95 border border-white/20 text-white flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 hover:bg-[#282a30] hover:scale-110 transition-all duration-200 cursor-pointer backdrop-blur-md"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Categories Chip Row with direct horizontal padding to prevent clipping */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 lg:px-8 py-1.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categoryList.map((category) => {
            const isSelected =
              Boolean(selectedCategory) &&
              (selectedCategory.toLowerCase() === category.name.toLowerCase() ||
                selectedCategory.toLowerCase() === category.id.toLowerCase());
            return (
              <button
                key={category.id || category.name}
                type="button"
                onClick={() => handleChipClick(category.name)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer flex-shrink-0 ${
                  isSelected
                    ? "bg-white text-black font-semibold shadow-md"
                    : "bg-[#27292e] text-zinc-300 hover:bg-[#35383f] hover:text-white border border-transparent"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll categories right"
            className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-[#18191c]/95 border border-white/20 text-white flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 hover:bg-[#282a30] hover:scale-110 transition-all duration-200 cursor-pointer backdrop-blur-md"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
