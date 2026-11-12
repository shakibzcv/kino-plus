import { BottomTabInset, MaxContentWidth } from "@/constants/theme";
import { useScrollTabBar } from "@/hooks/use-scroll-tab-bar";
import {
  getBingeWorthyShows,
  getRealityShows,
  getTvByCategory,
  invalidateUserCache,
  TrendingMovie,
} from "@/services/movies";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
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

const TvCard = React.memo(function TvCard({
  item,
  onPress,
}: {
  item: TrendingMovie;
  onPress?: () => void;
}) {
  const posterImg = item.poster || item.backdrop;
  const seasonsText = item.seasonCount
    ? `${item.seasonCount} Season${item.seasonCount > 1 ? "s" : ""}`
    : "TV Series";

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
        {seasonsText}
      </Text>
    </Pressable>
  );
});

const HorizontalTvRail = React.memo(function HorizontalTvRail({
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
      <TvCard item={item} onPress={() => onPressItem(item)} />
    ),
    [onPressItem]
  );

  const keyExtractor = useCallback(
    (item: TrendingMovie) => `tv-${item.id}`,
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

export default function TvShowsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { handleScroll } = useScrollTabBar();

  // 9 TV Show rails matching Web & Desktop
  const [bingeShows, setBingeShows] = useState<TrendingMovie[]>([]);
  const [dramaShows, setDramaShows] = useState<TrendingMovie[]>([]);
  const [realityShows, setRealityShows] = useState<TrendingMovie[]>([]);
  const [comedyShows, setComedyShows] = useState<TrendingMovie[]>([]);
  const [actionShows, setActionShows] = useState<TrendingMovie[]>([]);
  const [crimeShows, setCrimeShows] = useState<TrendingMovie[]>([]);
  const [sciFiShows, setSciFiShows] = useState<TrendingMovie[]>([]);
  const [familyShows, setFamilyShows] = useState<TrendingMovie[]>([]);
  const [docShows, setDocShows] = useState<TrendingMovie[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dataLoadedRef = useRef(false);

  const loadData = useCallback(async () => {
    try {
      // Phase 1: Above-the-fold rails (instant visual feedback)
      const [binge, drama, reality] = await Promise.allSettled([
        getBingeWorthyShows(),
        getTvByCategory("drama"),
        getRealityShows(),
      ]);

      if (binge.status === "fulfilled" && binge.value) setBingeShows(binge.value);
      if (drama.status === "fulfilled" && drama.value) setDramaShows(drama.value);
      if (reality.status === "fulfilled" && reality.value) setRealityShows(reality.value);

      setIsLoading(false);
      setIsRefreshing(false);

      // Phase 2: Background load of the remaining rails matching Web/Desktop
      const secondaryResults = await Promise.allSettled([
        getTvByCategory("comedy"),
        getTvByCategory("action"),
        getTvByCategory("crime"),
        getTvByCategory("fantasy"),
        getTvByCategory("family"),
        getTvByCategory("documentary"),
      ]);

      const [com, act, cri, scifi, fam, doc] = secondaryResults;
      if (com.status === "fulfilled" && com.value) setComedyShows(com.value);
      if (act.status === "fulfilled" && act.value) setActionShows(act.value);
      if (cri.status === "fulfilled" && cri.value) setCrimeShows(cri.value);
      if (scifi.status === "fulfilled" && scifi.value) setSciFiShows(scifi.value);
      if (fam.status === "fulfilled" && fam.value) setFamilyShows(fam.value);
      if (doc.status === "fulfilled" && doc.value) setDocShows(doc.value);
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
      params: { id: String(item.id), type: "tv" },
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
              TV Shows
            </Text>
            <Text className="mt-0.5 text-[13px] text-[#9aa0ad]">
              Streaming &amp; Popular
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/search")}
            hitSlop={10}
            className="items-center justify-center active:opacity-75"
            accessibilityRole="button"
            accessibilityLabel="Search TV Shows"
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
        {/* 9 Rails matching Web & Desktop Order */}
        {isLoading && bingeShows.length === 0 ? (
          <View style={{ gap: 24, paddingVertical: 12 }}>
            {[150, 180, 140, 165].map((titleWidth, rowIdx) => (
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
            {/* 1. Binge-Worthy Shows */}
            {bingeShows.length > 0 && (
              <HorizontalTvRail
                title="Binge-Worthy Shows"
                data={bingeShows}
                onPressItem={handleMediaPress}
                onSeeAll={() => router.push("/categories")}
              />
            )}

            {/* 2. Prestige Drama Series */}
            {dramaShows.length > 0 && (
              <HorizontalTvRail
                title="Prestige Drama Series"
                data={dramaShows}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "drama" },
                  })
                }
              />
            )}

            {/* 3. Reality & Lifestyle TV */}
            {realityShows.length > 0 && (
              <HorizontalTvRail
                title="Reality & Lifestyle TV"
                data={realityShows}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "reality" },
                  })
                }
              />
            )}

            {/* 4. Hilarious Comedy Series */}
            {comedyShows.length > 0 && (
              <HorizontalTvRail
                title="Hilarious Comedy Series"
                data={comedyShows}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "comedy" },
                  })
                }
              />
            )}

            {/* 5. Action & Adventure Series */}
            {actionShows.length > 0 && (
              <HorizontalTvRail
                title="Action & Adventure Series"
                data={actionShows}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "action" },
                  })
                }
              />
            )}

            {/* 6. Edge-of-Your-Seat Crime & Mystery */}
            {crimeShows.length > 0 && (
              <HorizontalTvRail
                title="Edge-of-Your-Seat Crime & Mystery"
                data={crimeShows}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "crime" },
                  })
                }
              />
            )}

            {/* 7. Sci-Fi & Fantasy Series */}
            {sciFiShows.length > 0 && (
              <HorizontalTvRail
                title="Sci-Fi & Fantasy Series"
                data={sciFiShows}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "fantasy" },
                  })
                }
              />
            )}

            {/* 8. Family Favorites & Kids */}
            {familyShows.length > 0 && (
              <HorizontalTvRail
                title="Family Favorites & Kids"
                data={familyShows}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "family" },
                  })
                }
              />
            )}

            {/* 9. Fascinating Documentaries & Docuseries */}
            {docShows.length > 0 && (
              <HorizontalTvRail
                title="Fascinating Documentaries & Docuseries"
                data={docShows}
                onPressItem={handleMediaPress}
                onSeeAll={() =>
                  router.push({
                    pathname: "/category/[category]",
                    params: { category: "documentary" },
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
