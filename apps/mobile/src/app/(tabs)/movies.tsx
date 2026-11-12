import { BottomTabInset, MaxContentWidth } from "@/constants/theme";
import { useScrollTabBar } from "@/hooks/use-scroll-tab-bar";
import {
  getActionMovies,
  getAwardWinningDramas,
  getHorrorMovies,
  getLeavingSoonMovies,
  getMoviesByCategory,
  getNewTrailers,
  getRecommendedMovies,
  getSciFiMovies,
  getTrendingTrailers,
  invalidateUserCache,
  TrailerItem,
  TrendingMovie,
} from "@/services/movies";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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

// ── SHARED RAILS & CARDS (MATCHING HOME 100%) ────────────────────────────────

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
  item: TrendingMovie;
  onPress?: () => void;
}) {
  const posterImg = item.poster || item.backdrop;
  const releaseYear = item.releaseDate ? item.releaseDate.slice(0, 4) : "2024";

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
        {item.rating > 0 && (
          <View className="absolute top-1.5 right-1.5 bg-[#0a0b0e]/85 px-1.5 py-0.5 rounded flex-row items-center gap-0.5">
            <Ionicons name="star" size={9} color="#f5c518" />
            <Text className="text-white text-[10px] font-bold">
              {item.rating.toFixed(1)}
            </Text>
          </View>
        )}
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
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-9 h-9 rounded-full bg-black/60 items-center justify-center">
            <Ionicons name="play" size={17} color="#ffffff" className="ml-0.5" />
          </View>
        </View>
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
  data: TrendingMovie[];
  onPressItem: (item: TrendingMovie) => void;
  onSeeAll?: () => void;
}) {
  const renderItem = useCallback(
    ({ item }: { item: TrendingMovie }) => (
      <PosterCard item={item} onPress={() => onPressItem(item)} />
    ),
    [onPressItem]
  );

  const keyExtractor = useCallback(
    (item: TrendingMovie) => `poster-${item.id}`,
    []
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
        onPress={onPressItem ? () => onPressItem(item) : undefined}
      />
    ),
    [onPressItem]
  );

  const keyExtractor = useCallback(
    (item: TrailerItem, idx: number) => `trailer-${item.id ?? idx}`,
    []
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

export default function MoviesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { handleScroll } = useScrollTabBar();

  // 12 Movie rails matching Web & Desktop
  const [recommended, setRecommended] = useState<TrendingMovie[]>([]);
  const [actionMovies, setActionMovies] = useState<TrendingMovie[]>([]);
  const [trendingTrailers, setTrendingTrailers] = useState<TrailerItem[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<TrendingMovie[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<TrendingMovie[]>([]);
  const [leavingSoon, setLeavingSoon] = useState<TrailerItem[]>([]);
  const [dramas, setDramas] = useState<TrendingMovie[]>([]);
  const [newTrailers, setNewTrailers] = useState<TrailerItem[]>([]);
  const [comedyMovies, setComedyMovies] = useState<TrendingMovie[]>([]);
  const [crimeMovies, setCrimeMovies] = useState<TrendingMovie[]>([]);
  const [adventureMovies, setAdventureMovies] = useState<TrendingMovie[]>([]);
  const [romanceMovies, setRomanceMovies] = useState<TrendingMovie[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dataLoadedRef = useRef(false);

  const loadData = useCallback(async () => {
    try {
      // Phase 1: Above-the-fold rails (instant visual feedback)
      const [rec, act, tr] = await Promise.allSettled([
        getRecommendedMovies(),
        getActionMovies(),
        getTrendingTrailers(),
      ]);

      if (rec.status === "fulfilled" && rec.value) setRecommended(rec.value);
      if (act.status === "fulfilled" && act.value) setActionMovies(act.value);
      if (tr.status === "fulfilled" && tr.value) setTrendingTrailers(tr.value);

      setIsLoading(false);
      setIsRefreshing(false);

      // Phase 2: Background load of the remaining rails matching Web/Desktop
      const secondaryResults = await Promise.allSettled([
        getHorrorMovies(),
        getSciFiMovies(),
        getLeavingSoonMovies(),
        getAwardWinningDramas(),
        getNewTrailers(),
        getMoviesByCategory("comedy"),
        getMoviesByCategory("crime"),
        getMoviesByCategory("adventure"),
        getMoviesByCategory("romance"),
      ]);

      const [hor, sci, ls, dra, newTr, com, cri, adv, rom] = secondaryResults;
      if (hor.status === "fulfilled" && hor.value) setHorrorMovies(hor.value);
      if (sci.status === "fulfilled" && sci.value) setSciFiMovies(sci.value);
      if (ls.status === "fulfilled" && ls.value) setLeavingSoon(ls.value);
      if (dra.status === "fulfilled" && dra.value) setDramas(dra.value);
      if (newTr.status === "fulfilled" && newTr.value) setNewTrailers(newTr.value);
      if (com.status === "fulfilled" && com.value) setComedyMovies(com.value);
      if (cri.status === "fulfilled" && cri.value) setCrimeMovies(cri.value);
      if (adv.status === "fulfilled" && adv.value) setAdventureMovies(adv.value);
      if (rom.status === "fulfilled" && rom.value) setRomanceMovies(rom.value);
    } catch {
      // Fail silently to keep UX smooth
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleMediaPress = (item: TrendingMovie) => {
    router.push({
      pathname: "/details/[id]",
      params: { id: String(item.id), type: "movie" },
    });
  };

  const bottomPad = insets.bottom + BottomTabInset + 16;

  return (
    <View className="flex-1 bg-[#0a0b0e]">
      <StatusBar barStyle="light-content" />

      {/* Sticky Top Header with dedicated title & subtitle */}
      <View
        className="px-4 pb-2.5 bg-[#0a0b0e]"
        style={{
          paddingTop: insets.top > 0 ? insets.top + 4 : 10,
          zIndex: 100,
          elevation: 8,
        }}
      >
        <View className="flex-row items-center justify-between pt-1">
          <View>
            <Text className="text-[28px] font-extrabold text-white tracking-tighter">
              Movies
            </Text>
            <Text className="mt-0.5 text-[13px] text-[#9aa0ad]">
              Streaming &amp; Popular
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/search")}
            hitSlop={10}
            className="items-center justify-center active:opacity-75 p-1"
            accessibilityRole="button"
            accessibilityLabel="Search Movies"
          >
            <Ionicons name="search" size={22} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* Scrollable Content */}
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
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              invalidateUserCache();
              loadData();
            }}
            tintColor="#f2545b"
            colors={["#f2545b"]}
          />
        }
      >

        {/* 12 Rails matching Web & Desktop Order */}
        {isLoading && recommended.length === 0 ? (
          <View style={{ gap: 24, paddingVertical: 12 }}>
            {[150, 190, 140, 170].map((titleWidth, rowIdx) => (
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
            {/* 1. Recommended For You */}
            {recommended.length > 0 && (
              <HorizontalPosterRail
                title="Recommended For You"
                data={recommended}
                onPressItem={handleMediaPress}
                onSeeAll={() => router.push("/categories")}
              />
            )}

            {/* 2. High-Octane Action Blockbusters */}
            {actionMovies.length > 0 && (
              <HorizontalPosterRail
                title="High-Octane Action Blockbusters"
                data={actionMovies}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "action" },
                  })
                }
              />
            )}

            {/* 3. Trending Movie Trailers */}
            {trendingTrailers.length > 0 && (
              <HorizontalTrailerRail
                title="Trending Movie Trailers"
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

            {/* 4. Spine-Chilling Horror Debuts */}
            {horrorMovies.length > 0 && (
              <HorizontalPosterRail
                title="Spine-Chilling Horror Debuts"
                data={horrorMovies}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "horror" },
                  })
                }
              />
            )}

            {/* 5. Sci-Fi & Cyberpunk Visions */}
            {sciFiMovies.length > 0 && (
              <HorizontalPosterRail
                title="Sci-Fi & Cyberpunk Visions"
                data={sciFiMovies}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "sci-fi" },
                  })
                }
              />
            )}

            {/* 6. Leaving Soon */}
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

            {/* 7. Critically Acclaimed Dramas */}
            {dramas.length > 0 && (
              <HorizontalPosterRail
                title="Critically Acclaimed Dramas"
                data={dramas}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "drama" },
                  })
                }
              />
            )}

            {/* 8. New Movie Trailers */}
            {newTrailers.length > 0 && (
              <HorizontalTrailerRail
                title="New Movie Trailers"
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

            {/* 9. Laugh-Out-Loud Comedies */}
            {comedyMovies.length > 0 && (
              <HorizontalPosterRail
                title="Laugh-Out-Loud Comedies"
                data={comedyMovies}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "comedy" },
                  })
                }
              />
            )}

            {/* 10. Thrilling Crime & Mystery */}
            {crimeMovies.length > 0 && (
              <HorizontalPosterRail
                title="Thrilling Crime & Mystery"
                data={crimeMovies}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "crime" },
                  })
                }
              />
            )}

            {/* 11. Epic Adventures & Quests */}
            {adventureMovies.length > 0 && (
              <HorizontalPosterRail
                title="Epic Adventures & Quests"
                data={adventureMovies}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "adventure" },
                  })
                }
              />
            )}

            {/* 12. Romantic Favorites & Love Stories */}
            {romanceMovies.length > 0 && (
              <HorizontalPosterRail
                title="Romantic Favorites & Love Stories"
                data={romanceMovies}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "romance" },
                  })
                }
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
