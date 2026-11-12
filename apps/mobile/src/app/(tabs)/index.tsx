import { KinoLogo } from "@/components/kino-logo";
import { BottomTabInset, MaxContentWidth } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { useUserData } from "@/context/user-data-context";
import { useScrollTabBar } from "@/hooks/use-scroll-tab-bar";
import {
  CategoryItem,
  getActionMovies,
  getAnimeShows,
  getAwardWinningDramas,
  getBingeWorthyShows,
  getCategories,
  getHorrorMovies,
  getLeavingSoonMovies,
  getMostWatchlisted,
  getNewTrailers,
  getRealityShows,
  getRecommendedMovies,
  getSciFiMovies,
  getTrendingTrailers,
  invalidateUserCache,
  setServiceAuthToken,
  TrailerItem,
  TrendingMovie,
} from "@/services/movies";
import { WatchlistItem } from "@/services/user-data";
import { cache, CacheKeys } from "@/utils/cache";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- SUB-COMPONENTS -----------------------------------------------------------

const SectionHeader = React.memo(function SectionHeader({
  title,
  showChevron = true,
  onPress,
}: {
  title: string;
  showChevron?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="px-4 active:opacity-75"
    >
      <View className="flex-row items-center gap-1">
        <Text className="text-[18px] font-bold text-white tracking-tight">
          {title}
        </Text>
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={17}
            color="#9aa0ad"
            className="mt-0.5"
          />
        )}
      </View>
    </Pressable>
  );
});

const PosterCard = React.memo(function PosterCard({
  item,
  onPress,
}: {
  item: TrendingMovie | WatchlistItem;
  onPress?: () => void;
}) {
  const posterImg =
    ("poster" in item ? item.poster : item.posterPath) ||
    ("backdrop" in item ? item.backdrop : item.backdropPath);
  const releaseYear =
    "releaseDate" in item && item.releaseDate
      ? item.releaseDate.slice(0, 4)
      : "year" in item
        ? (item as any).year
        : "2024";

  return (
    <Pressable
      className="w-[124px] gap-1 active:opacity-75 active:scale-[0.985]"
      onPress={onPress}
    >
      <View className="relative h-[184px] w-[124px] overflow-hidden rounded-[10px] bg-[#1b1d22]">
        <ExpoImage
          source={{
            uri:
              posterImg ||
              "https://image.tmdb.org/t/p/w342/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
          }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      </View>
      <Text
        className="mt-0.5 text-[13px] font-semibold leading-[17px] text-white"
        numberOfLines={2}
      >
        {item.title}
      </Text>
      <Text className="text-[11px] font-medium text-[#8a91a0]">
        {releaseYear}
      </Text>
    </Pressable>
  );
});

const TrailerCard = React.memo(function TrailerCard({
  item,
  onPress,
}: {
  item: TrailerItem;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className="w-[216px] gap-1 active:opacity-75 active:scale-[0.985]"
      onPress={onPress}
    >
      <View className="relative h-[122px] w-[216px] overflow-hidden rounded-[10px] bg-[#1b1d22]">
        <ExpoImage
          source={{ uri: item.thumbnail }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={["transparent", "rgba(10, 11, 14, 0.7)"]}
          className="absolute bottom-0 left-0 right-0 h-[60px]"
        />
      </View>
      <Text
        className="mt-0.5 text-[13px] font-semibold leading-[17px] text-white"
        numberOfLines={2}
      >
        {item.title}
      </Text>
      {item.subtitle && (
        <Text
          className="text-[11px] font-medium text-[#8a91a0]"
          numberOfLines={1}
        >
          {item.subtitle}
        </Text>
      )}
    </Pressable>
  );
});

const HorizontalPosterRail = React.memo(function HorizontalPosterRail({
  title,
  data,
  onPressItem,
  onSeeAll,
}: {
  title: string;
  data: (TrendingMovie | WatchlistItem)[];
  onPressItem: (item: TrendingMovie | WatchlistItem) => void;
  onSeeAll?: () => void;
}) {
  const renderItem = useCallback(
    ({ item }: { item: TrendingMovie | WatchlistItem }) => (
      <PosterCard item={item} onPress={() => onPressItem(item)} />
    ),
    [onPressItem],
  );

  const keyExtractor = useCallback(
    (item: TrendingMovie | WatchlistItem) =>
      `poster-${"mediaId" in item ? item.mediaId : item.id}`,
    [],
  );

  return (
    <View className="gap-3">
      <SectionHeader
        title={title}
        showChevron={Boolean(onSeeAll)}
        onPress={onSeeAll}
      />
      <FlatList
        horizontal
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 gap-3"
        className="mx-0"
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
        removeClippedSubviews={Platform.OS === "android"}
      />
    </View>
  );
});

const HorizontalTrailerRail = React.memo(function HorizontalTrailerRail({
  title,
  data,
  onPressItem,
  onSeeAll,
}: {
  title: string;
  data: TrailerItem[];
  onPressItem?: (item: TrailerItem) => void;
  onSeeAll?: () => void;
}) {
  const renderItem = useCallback(
    ({ item }: { item: TrailerItem }) => (
      <TrailerCard
        item={item}
        onPress={onPressItem ? () => onPressItem(item) : onSeeAll}
      />
    ),
    [onPressItem, onSeeAll],
  );

  const keyExtractor = useCallback(
    (item: TrailerItem) => `trailer-${item.id}`,
    [],
  );

  return (
    <View className="gap-3">
      <SectionHeader
        title={title}
        showChevron={Boolean(onSeeAll)}
        onPress={onSeeAll}
      />
      <FlatList
        horizontal
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 gap-3"
        className="mx-0"
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews={Platform.OS === "android"}
      />
    </View>
  );
});

// --- MAIN SCREEN --------------------------------------------------------------

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, authToken } = useAuth();
  const { watchlist } = useUserData();
  const { handleScroll } = useScrollTabBar();

  // Media data states matching web dashboard - initialized from memory cache for instant 0ms mount
  const [watchlisted, setWatchlisted] = useState<TrendingMovie[]>(
    () => cache.get(CacheKeys.MOST_WATCHLISTED) || [],
  );
  const [recommended, setRecommended] = useState<TrendingMovie[]>(
    () => cache.get(CacheKeys.RECOMMENDED) || [],
  );
  const [trendingTrailers, setTrendingTrailers] = useState<TrailerItem[]>(
    () => cache.get(CacheKeys.TRENDING_TRAILERS) || [],
  );
  const [horrorMovies, setHorrorMovies] = useState<TrendingMovie[]>(
    () => cache.get(CacheKeys.HORROR_MOVIES) || [],
  );
  const [leavingSoon, setLeavingSoon] = useState<TrailerItem[]>(
    () => cache.get(CacheKeys.LEAVING_SOON) || [],
  );
  const [animeShows, setAnimeShows] = useState<TrendingMovie[]>(
    () => cache.get(CacheKeys.ANIME_SHOWS) || [],
  );
  const [bingeShows, setBingeShows] = useState<TrendingMovie[]>(
    () => cache.get(CacheKeys.BINGE_SHOWS) || [],
  );
  const [actionMovies, setActionMovies] = useState<TrendingMovie[]>(
    () => cache.get(CacheKeys.ACTION_MOVIES) || [],
  );
  const [newTrailers, setNewTrailers] = useState<TrailerItem[]>(
    () => cache.get(CacheKeys.NEW_TRAILERS) || [],
  );
  const [realityShows, setRealityShows] = useState<TrendingMovie[]>(
    () => cache.get(CacheKeys.REALITY_SHOWS) || [],
  );
  const [sciFiMovies, setSciFiMovies] = useState<TrendingMovie[]>(
    () => cache.get(CacheKeys.SCIFI_MOVIES) || [],
  );
  const [dramas, setDramas] = useState<TrendingMovie[]>(
    () => cache.get(CacheKeys.DRAMAS) || [],
  );
  const [categories, setCategories] = useState<CategoryItem[]>(
    () => cache.get(CacheKeys.CATEGORIES) || [],
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(
    () => !cache.get(CacheKeys.MOST_WATCHLISTED),
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const dashboardLoadedRef = useRef<boolean>(false);
  const lastLoadedTokenRef = useRef<string | null>(null);

  // Load dashboard sections with priority staging (above-the-fold first)
  const loadDashboardMedia = useCallback(async (token?: string | null) => {
    if (token) {
      setServiceAuthToken(token);
    }
    try {
      // Phase 1: Critical above-the-fold rails (Categories, Watchlisted, Recommended, Trending Trailers)
      const primaryResults = await Promise.allSettled([
        getCategories(),
        getMostWatchlisted(),
        getRecommendedMovies(),
        getTrendingTrailers(),
      ]);

      const [catsRes, watchlistedRes, recRes, trendRes] = primaryResults;

      const fulfilledPrimary = primaryResults.filter(
        (r) => r.status === "fulfilled",
      ).length;
      if (fulfilledPrimary === 0) {
        setApiError(
          "Internal Server Error. Could not connect to streaming service.",
        );
        return;
      }

      if (catsRes.status === "fulfilled" && catsRes.value)
        setCategories(catsRes.value);
      if (watchlistedRes.status === "fulfilled" && watchlistedRes.value)
        setWatchlisted(watchlistedRes.value);
      if (recRes.status === "fulfilled" && recRes.value)
        setRecommended(recRes.value);
      if (trendRes.status === "fulfilled" && trendRes.value)
        setTrendingTrailers(trendRes.value);

      // Above-the-fold rails are ready: render UI immediately
      setIsInitialLoading(false);
      setIsRefreshing(false);

      // Phase 2: Stagger remaining rails so sockets/CPU are not overloaded
      const secondaryResults = await Promise.allSettled([
        getHorrorMovies(),
        getLeavingSoonMovies(),
        getAnimeShows(),
        getBingeWorthyShows(),
        getActionMovies(),
        getNewTrailers(),
        getRealityShows(),
        getSciFiMovies(),
        getAwardWinningDramas(),
      ]);

      const [
        horrorRes,
        leavingRes,
        animeRes,
        bingeRes,
        actionRes,
        trailersRes,
        realityRes,
        scifiRes,
        dramasRes,
      ] = secondaryResults;

      if (horrorRes.status === "fulfilled" && horrorRes.value)
        setHorrorMovies(horrorRes.value);
      if (leavingRes.status === "fulfilled" && leavingRes.value)
        setLeavingSoon(leavingRes.value);
      if (animeRes.status === "fulfilled" && animeRes.value)
        setAnimeShows(animeRes.value);
      if (bingeRes.status === "fulfilled" && bingeRes.value)
        setBingeShows(bingeRes.value);
      if (actionRes.status === "fulfilled" && actionRes.value)
        setActionMovies(actionRes.value);
      if (trailersRes.status === "fulfilled" && trailersRes.value)
        setNewTrailers(trailersRes.value);
      if (realityRes.status === "fulfilled" && realityRes.value)
        setRealityShows(realityRes.value);
      if (scifiRes.status === "fulfilled" && scifiRes.value)
        setSciFiMovies(scifiRes.value);
      if (dramasRes.status === "fulfilled" && dramasRes.value)
        setDramas(dramasRes.value);
    } catch {
      setApiError(
        "Internal Server Error. Please check your backend connection.",
      );
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Prevent duplicate fetch stampede when authToken silently refreshes for the same active session
    if (dashboardLoadedRef.current && authToken) {
      setServiceAuthToken(authToken);
      lastLoadedTokenRef.current = authToken;
      return;
    }
    dashboardLoadedRef.current = true;
    lastLoadedTokenRef.current = authToken || null;
    const timer = setTimeout(() => {
      loadDashboardMedia(authToken);
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboardMedia, authToken]);

  const handleMediaPress = (item: TrendingMovie | WatchlistItem) => {
    const id = "mediaId" in item ? item.mediaId : item.id;
    const rawType = "mediaType" in item ? item.mediaType : undefined;
    const type = rawType === "tv" ? "tv" : rawType === "movie" ? "movie" : undefined;
    router.push({
      pathname: "/details/[id]",
      params: {
        id: String(id),
        ...(type ? { type } : {}),
      },
    });
  };

  const bottomPad = insets.bottom + BottomTabInset + 16;

  return (
    <View className="flex-1 bg-[#0a0b0e]">
      <StatusBar barStyle="light-content" />

      {/* ========================================================
          📌 STICKY TOP HEADER (ALWAYS AT THE TOP WHEN SCROLLING)
          ======================================================== */}
      <View
        className="flex-row items-center justify-between bg-[#0a0b0e] px-4 pb-2.5"
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#0a0b0e",
          paddingHorizontal: 16,
          paddingBottom: 10,
          paddingTop: insets.top > 0 ? insets.top + 4 : 10,
          zIndex: 100,
          elevation: 8,
        }}
      >
        {/* Left: Brand Logo */}
        <KinoLogo size="sm" useImage={false} />

        {/* Right: 4 Action Icons in Exact Order */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
          {/* 1. Search */}
          <Pressable
            onPress={() => router.push("/search")}
            hitSlop={10}
            className="items-center justify-center active:opacity-75"
            accessibilityLabel="Search"
          >
            <Ionicons name="search" size={22} color="#ffffff" />
          </Pressable>

          {/* 3. Watchlist (Bookmark Icon) */}
          <Pressable
            onPress={() => router.push("/watchlist")}
            hitSlop={10}
            className="items-center justify-center active:opacity-75"
            accessibilityLabel="Watchlist"
          >
            <Ionicons
              name="bookmark-outline"
              size={22}
              color="#ffffff"
            />
          </Pressable>

          {/* 4. Profile / Avatar */}
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={8}
            className="p-0.5 active:opacity-75"
            accessibilityLabel="Profile Settings"
          >
            {user?.photo ? (
              <ExpoImage
                source={{ uri: user.photo }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: "rgba(255, 255, 255, 0.25)",
                }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#23252d",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: "rgba(255, 255, 255, 0.25)",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#ffffff" }}>
                  {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* ========================================================
          📱 SCROLLABLE CONTENT (SCROLLS UNDER STICKY HEADER)
          ======================================================== */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full gap-7 pt-3"
        contentContainerStyle={{
          paddingBottom: bottomPad,
          maxWidth: MaxContentWidth,
        }}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        scrollEventThrottle={32}
        removeClippedSubviews={true}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              // Invalidate cache to force fresh data
              invalidateUserCache();
              loadDashboardMedia(authToken);
            }}
            tintColor="#f2545b"
            colors={["#f2545b"]}
          />
        }
      >
        <View
          className="mx-auto w-full gap-7"
          style={{ maxWidth: MaxContentWidth }}
        >
          {apiError ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 24 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(242, 84, 91, 0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(242, 84, 91, 0.3)",
                  marginBottom: 16,
                }}
              >
                <Ionicons
                  name="cloud-offline-outline"
                  size={42}
                  color="#f2545b"
                />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#ffffff", letterSpacing: -0.4, textAlign: "center", marginBottom: 8 }}>
                Internal Server Error
              </Text>
              <Text style={{ fontSize: 14, color: "#8a91a0", textAlign: "center", maxWidth: 300, lineHeight: 20, marginBottom: 20 }}>
                Unable to load movies and TV shows from the streaming server.
                Please verify your backend connection.
              </Text>
              <Pressable
                style={({ pressed }) => ({
                  backgroundColor: "#f2545b",
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  elevation: 6,
                  shadowColor: "#f2545b",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                })}
                onPress={() => {
                  setIsInitialLoading(true);
                  setApiError(null);
                  loadDashboardMedia(authToken);
                }}
              >
                <Ionicons name="refresh" size={17} color="#ffffff" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#ffffff" }}>
                  Retry Connection
                </Text>
              </Pressable>
            </View>
          ) : isInitialLoading ? (
            <View style={{ gap: 24, paddingVertical: 12 }}>
              {[140, 180, 150, 165].map((titleWidth, rowIdx) => (
                <View key={`skel-row-${rowIdx}`} style={{ paddingHorizontal: 16 }}>
                  <View style={{ width: titleWidth, height: 16, borderRadius: 4, backgroundColor: "#1e212b", marginBottom: 12 }} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                    {[1, 2, 3, 4].map((k) => (
                      <View key={k} style={{ width: 124 }}>
                        <View style={{ width: 124, height: 184, borderRadius: 10, backgroundColor: "#16181f" }} />
                        <View style={{ width: 85, height: 12, borderRadius: 4, backgroundColor: "#1e212b", marginTop: 8 }} />
                        <View style={{ width: 45, height: 10, borderRadius: 3, backgroundColor: "#191b24", marginTop: 4 }} />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ))}
            </View>
          ) : (
            <>
              {/* SECTION: BROWSE MOVIES & TV SHOWS */}
              {categories && categories.length > 0 && (
                <View className="gap-3">
                  <SectionHeader
                    title="Browse Movies & TV Shows"
                    showChevron={true}
                    onPress={() => router.push("/categories")}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="px-4 gap-2 py-0.5"
                    className="mx-0"
                  >
                    <Pressable
                      className="rounded-full bg-[#181a24] px-[18px] py-[9px] active:bg-[#20222a] active:scale-[0.97]"
                      onPress={() => router.push("/categories")}
                    >
                      <Text className="text-[14px] font-bold text-[#9aa0ad]">
                        All Categories
                      </Text>
                    </Pressable>

                    {categories.map((cat) => (
                      <Pressable
                        key={cat.id || cat.name}
                        className="rounded-full bg-[#181a24] px-[18px] py-[9px] active:bg-[#20222a] active:scale-[0.97]"
                        onPress={() =>
                          router.push({
                            pathname: "/category/[category]",
                            params: { category: cat.name },
                          })
                        }
                      >
                        <Text className="text-[14px] font-bold text-[#9aa0ad]">
                          {cat.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* SECTION 3: MOST WATCHLISTED THIS WEEK */}
              {watchlisted.length > 0 && (
                <HorizontalPosterRail
                  title="Most Watchlisted This Week"
                  data={watchlisted}
                  onPressItem={handleMediaPress}
                  onSeeAll={() => router.push("/categories")}
                />
              )}

              {/* SECTION 4: RECOMMENDED FOR YOU */}
              {recommended.length > 0 && (
                <HorizontalPosterRail
                  title="Recommended For You"
                  data={recommended}
                  onPressItem={handleMediaPress}
                  onSeeAll={() => router.push("/categories")}
                />
              )}

              {/* SECTION 5: TRENDING TRAILERS */}
              {trendingTrailers.length > 0 && (
                <HorizontalTrailerRail
                  title="Trending Trailers"
                  data={trendingTrailers}
                  onPressItem={(trailer) => {
                    router.push({
                      pathname: "/details/[id]",
                      params: { id: String(trailer.id), type: "movie" },
                    });
                  }}
                  onSeeAll={() => router.push("/categories")}
                />
              )}

              {/* SECTION 6: SPINE-CHILLING HORROR DEBUTS */}
              {horrorMovies.length > 0 && (
                <HorizontalPosterRail
                  title="Spine-Chilling Horror Debuts"
                  data={horrorMovies}
                  onPressItem={handleMediaPress}
                  onSeeAll={() => router.push("/categories")}
                />
              )}

              {/* SECTION 7: LEAVING SOON */}
              {leavingSoon.length > 0 && (
                <HorizontalTrailerRail
                  title="Leaving Soon"
                  data={leavingSoon}
                  onPressItem={(trailer) => {
                    router.push({
                      pathname: "/details/[id]",
                      params: { id: String(trailer.id), type: "movie" },
                    });
                  }}
                  onSeeAll={() => router.push("/categories")}
                />
              )}

              {/* SECTION 8: ANIME HITS & ANIMATION */}
              {animeShows.length > 0 && (
                <HorizontalPosterRail
                  title="Anime Hits & Animation"
                  data={animeShows}
                  onPressItem={handleMediaPress}
                  onSeeAll={() => router.push("/categories")}
                />
              )}

              {/* SECTION 9: BINGE-WORTHY SHOWS */}
              {bingeShows.length > 0 && (
                <HorizontalPosterRail
                  title="Binge-Worthy Shows"
                  data={bingeShows}
                  onPressItem={handleMediaPress}
                  onSeeAll={() => router.push("/categories")}
                />
              )}

              {/* SECTION 10: HIGH-OCTANE ACTION BLOCKBUSTERS */}
              {actionMovies.length > 0 && (
                <HorizontalPosterRail
                  title="High-Octane Action Blockbusters"
                  data={actionMovies}
                  onPressItem={handleMediaPress}
                  onSeeAll={() => router.push("/categories")}
                />
              )}

              {/* SECTION 11: NEW TRAILERS */}
              {newTrailers.length > 0 && (
                <HorizontalTrailerRail
                  title="New Trailers"
                  data={newTrailers}
                  onPressItem={(trailer) => {
                    router.push({
                      pathname: "/details/[id]",
                      params: { id: String(trailer.id), type: "movie" },
                    });
                  }}
                  onSeeAll={() => router.push("/categories")}
                />
              )}

              {/* SECTION 12: REALITY & LIFESTYLE TV */}
              {realityShows.length > 0 && (
                <HorizontalPosterRail
                  title="Reality & Lifestyle TV"
                  data={realityShows}
                  onPressItem={handleMediaPress}
                  onSeeAll={() => router.push("/categories")}
                />
              )}

              {/* SECTION 13: SCI-FI & CYBERPUNK VISIONS */}
              {sciFiMovies.length > 0 && (
                <HorizontalPosterRail
                  title="Sci-Fi & Cyberpunk Visions"
                  data={sciFiMovies}
                  onPressItem={handleMediaPress}
                  onSeeAll={() => router.push("/categories")}
                />
              )}

              {/* SECTION 14: CRITICALLY ACCLAIMED DRAMAS */}
              {dramas.length > 0 && (
                <HorizontalPosterRail
                  title="Critically Acclaimed Dramas"
                  data={dramas}
                  onPressItem={handleMediaPress}
                  onSeeAll={() => router.push("/categories")}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
