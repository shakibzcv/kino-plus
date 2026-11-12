import { HeaderSearchBar } from "@/components/header-search-bar";
import { BottomTabInset } from "@/constants/theme";
import { useScrollTabBar } from "@/hooks/use-scroll-tab-bar";
import { CategoryItem, getCategories } from "@/services/movies";
import { cache, CacheKeys } from "@/utils/cache";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// ---------------------------------------------------------------------------
// VIBRANT CATEGORY COLORS MATCHING THE IMAGE DESIGN
// ---------------------------------------------------------------------------
const CATEGORY_COLORS: Record<string, string> = {
  action: "#0da5a5",
  animation: "#4caf50",
  comedy: "#9c27b0",
  crime: "#424242",
  documentary: "#ff9800",
  drama: "#795548",
  "en-espanol": "#ba68c8",
  enespanol: "#ba68c8",
  horror: "#e53935",
  music: "#66bb6a",
  romance: "#e91e63",
  scifi: "#2196f3",
  "sci-fi": "#2196f3",
  thriller: "#1a1a1a",
  western: "#ffb74d",
  "descriptive-audio": "#616161",
  descriptiveaudio: "#616161",
};

function getCategoryColor(cat: CategoryItem): string {
  const normalizedId = (cat.id || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (CATEGORY_COLORS[normalizedId]) {
    return CATEGORY_COLORS[normalizedId];
  }
  const normalizedName = (cat.name || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  if (CATEGORY_COLORS[normalizedName]) {
    return CATEGORY_COLORS[normalizedName];
  }
  return cat.bg || "#424242";
}

// ---------------------------------------------------------------------------
// RESPONSIVE GRADIENT CATEGORY CARD COMPONENT
// ---------------------------------------------------------------------------
interface CategoryCardProps {
  category: CategoryItem;
  width: number;
  onPress: () => void;
}

const CategoryCard = React.memo(function CategoryCard({
  category,
  width,
  onPress,
}: CategoryCardProps) {
  const categoryColor = useMemo(() => getCategoryColor(category), [category]);

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-2xl border border-white/12 shadow-lg active:opacity-88 active:scale-[0.97]"
      style={[
        { width, height: 106 },
        {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 4,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={category.name}
    >
      <View
        className="flex-1 items-center justify-center px-3"
        style={{ backgroundColor: categoryColor }}
      >
        {/* Category Title */}
        <Text
          className="text-center text-[16px] font-bold text-white"
          numberOfLines={2}
        >
          {category.name}
        </Text>
      </View>
    </Pressable>
  );
});

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { handleScroll } = useScrollTabBar();

  // Strictly 2 categories per row with larger rectangular cards (per user request)
  const numColumns = 2;
  const gap = 12;
  const horizontalPadding = 12 * 2;
  const cardWidth = Math.floor(
    (windowWidth - horizontalPadding - gap * (numColumns - 1)) / numColumns,
  );

  const [categories, setCategories] = useState<CategoryItem[]>(
    () => cache.get(CacheKeys.CATEGORIES) || [],
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !cache.get(CacheKeys.CATEGORIES),
  );
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [apiError, setApiError] = useState<string | null>(null);

  // Handle hardware back button to dismiss search
  useEffect(() => {
    if (!isSearchOpen) return;
    const backSub = BackHandler.addEventListener("hardwareBackPress", () => {
      setIsSearchOpen(false);
      setSearchQuery("");
      return true;
    });
    return () => backSub.remove();
  }, [isSearchOpen]);

  // Load categories from the Express API
  const loadCategories = useCallback(async () => {
    setApiError(null);
    try {
      const data = await getCategories();
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        setApiError("No categories available right now.");
      }
    } catch (err) {
      console.warn("[Categories] Error loading categories:", err);
      setApiError(
        "Couldn't load categories. Check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Open category media viewer
  const handleOpenCategory = useCallback(
    (cat: CategoryItem) => {
      router.push({
        pathname: "/category/[category]",
        params: { category: cat.name },
      });
    },
    [router],
  );

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const data = await getCategories();
        if (isMounted) {
          if (data && data.length > 0) {
            setCategories(data);
          } else {
            setApiError("No categories available right now.");
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.warn("[Categories] Error loading categories:", err);
          setApiError(
            "Couldn't load categories. Check your connection and try again.",
          );
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCategories();
  }, [loadCategories]);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  );

  return (
    <View className="flex-1 bg-[#0a0b0e]">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* ========================================================
            📌 STICKY TOP HEADER (ALWAYS AT THE TOP WHEN SCROLLING)
            ======================================================== */}
        <View
          className="px-4 pb-2.5 bg-[#0a0b0e]"
          style={{
            zIndex: 100,
            elevation: 8,
          }}
        >
          {isSearchOpen ? (
            <View className="pt-1">
              <HeaderSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClose={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                placeholder="Search genres..."
              />
            </View>
          ) : (
            <View className="flex-row items-center justify-between pt-1">
              <View>
                <Text className="text-[28px] font-extrabold text-white tracking-tighter">
                  Categories
                </Text>
                <Text className="mt-0.5 text-[13px] text-[#9aa0ad]">
                  {categories.length > 0
                    ? `${categories.length} ${categories.length === 1 ? "genre" : "genres"}`
                    : "Browse by genre"}
                </Text>
              </View>

              <Pressable
                onPress={() => setIsSearchOpen(true)}
                className="p-1 items-center justify-center active:opacity-70"
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Search Categories"
              >
                <Ionicons name="search" size={22} color="#ffffff" />
              </Pressable>
            </View>
          )}
        </View>

        {/* Content */}
        {apiError ? (
          <View className="flex-1 items-center justify-center gap-3 py-16">
            <Ionicons name="cloud-offline-outline" size={48} color="#f2545b" />
            <Text className="text-[20px] font-extrabold text-white mt-2">
              Couldn't load categories
            </Text>
            <Text className="text-[13px] text-[#9aa0ad]">{apiError}</Text>
            <Pressable
              onPress={() => {
                setIsLoading(true);
                loadCategories();
              }}
              className="mt-2 self-center rounded-full bg-[#f2545b] px-5 py-2.5 active:opacity-80"
            >
              <Text className="text-white font-bold">Retry</Text>
            </Pressable>
          </View>
        ) : isLoading ? (
          <View
            className="flex-row flex-wrap px-3 pt-2 gap-3"
            style={{ paddingBottom: insets.bottom + BottomTabInset + 16 }}
          >
            {Array.from({ length: 12 }).map((_, idx) => (
              <View
                key={`cat-skeleton-${idx}`}
                className="h-[106px] rounded-2xl bg-[#1d2028]"
                style={{ width: cardWidth }}
              />
            ))}
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="flex-row flex-wrap px-3 pt-2 gap-3"
            contentContainerStyle={{
              paddingBottom: insets.bottom + BottomTabInset + 16,
            }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#f2545b"
                colors={["#f2545b"]}
              />
            }
          >
            {filteredCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                width={cardWidth}
                onPress={() => handleOpenCategory(cat)}
              />
            ))}

            {filteredCategories.length === 0 && (
              <View className="w-full items-center justify-center gap-2.5 py-12">
                <Ionicons name="search-outline" size={44} color="#757c8d" />
                <Text className="text-[14px] text-[#757c8d]">
                  No categories found
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
