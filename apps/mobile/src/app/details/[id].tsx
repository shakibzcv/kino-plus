import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Share,
  Linking,
  Dimensions,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { BrandColors } from '@/constants/theme';
import { useUserData } from '@/context/user-data-context';
import {
  getMediaDetails,
  getTvSeasonEpisodes,
  getTvSeriesRatings,
  SeriesRatingsGraphData,
  MediaDetails,
  FormattedSeason,
  FormattedEpisode,
  TrendingMovie,
} from '@/services/movies';
import { SeriesRatingsGraph } from '@/components/series-ratings-graph';
import { WatchProviders } from '@/components/watch-providers';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const s = StyleSheet.create({
  dim: { opacity: 0.75 },
  shadowPrimary: {
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  shadowCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

function SkeletonBlock({ style }: { style: any }) {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        { backgroundColor: '#1c1f26', borderRadius: 8 },
        style,
        { opacity: opacityAnim },
      ]}
    />
  );
}

function DetailsSkeleton({ insets }: { insets: any }) {
  const router = useRouter();
  return (
    <View className="flex-1 bg-[#0a0b0e]">
      <StatusBar barStyle="light-content" />

      {/* Floating Header Controls */}
      <View
        className="absolute left-0 right-0 z-30 flex-row items-center justify-between px-3"
        style={{
          top: insets.top > 0 ? insets.top + 2 : 8,
          height: 52,
        }}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center active:opacity-70"
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color="#ffffff" />
        </Pressable>
        <View className="flex-row items-center gap-2">
          <SkeletonBlock style={{ width: 36, height: 36, borderRadius: 18 }} />
          <SkeletonBlock style={{ width: 36, height: 36, borderRadius: 18 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Hero Section Placeholder */}
        <View className="h-[360px] relative overflow-hidden bg-[#14161c]">
          <SkeletonBlock style={{ width: '100%', height: '100%', borderRadius: 0 }} />
          <LinearGradient
            colors={['transparent', 'rgba(10,11,14,0.4)', 'rgba(10,11,14,0.85)', '#0a0b0e']}
            locations={[0, 0.45, 0.8, 1]}
            className="absolute bottom-0 left-0 right-0 h-56"
          />
        </View>

        {/* Poster & Title Metadata */}
        <View className="px-4 -mt-16 z-10 mb-4">
          <View className="flex-row gap-3.5 items-end mb-3">
            {/* Poster Card */}
            <SkeletonBlock style={{ width: 104, height: 154, borderRadius: 12 }} />

            {/* Title & Metadata bars beside Poster */}
            <View className="flex-1 justify-end pb-1">
              <SkeletonBlock style={{ width: '85%', height: 22, borderRadius: 6, marginBottom: 8 }} />
              <SkeletonBlock style={{ width: '55%', height: 14, borderRadius: 4, marginBottom: 12 }} />
              <View className="flex-row items-center gap-2">
                <SkeletonBlock style={{ width: 56, height: 20, borderRadius: 4 }} />
                <SkeletonBlock style={{ width: 40, height: 20, borderRadius: 4 }} />
                <SkeletonBlock style={{ width: 52, height: 20, borderRadius: 4 }} />
              </View>
            </View>
          </View>

          {/* Clean Rating Pill Placeholder */}
          <View className="pt-1">
            <SkeletonBlock style={{ width: 58, height: 24, borderRadius: 8 }} />
          </View>
        </View>

        {/* Genre Pills */}
        <View className="flex-row gap-2 px-4 mb-4">
          <SkeletonBlock style={{ width: 72, height: 28, borderRadius: 14 }} />
          <SkeletonBlock style={{ width: 84, height: 28, borderRadius: 14 }} />
          <SkeletonBlock style={{ width: 68, height: 28, borderRadius: 14 }} />
        </View>

        {/* Primary Action Buttons */}
        <View className="flex-row items-center gap-2.5 px-4 mb-4">
          <SkeletonBlock style={{ flex: 1, height: 48, borderRadius: 12 }} />
          <SkeletonBlock style={{ width: 96, height: 48, borderRadius: 12 }} />
        </View>

        {/* Quick Actions Row */}
        <View className="flex-row justify-around px-3 py-3 mb-5 bg-[#14161c] mx-4 rounded-2xl">
          <View className="items-center gap-1.5">
            <SkeletonBlock style={{ width: 38, height: 38, borderRadius: 19 }} />
            <SkeletonBlock style={{ width: 44, height: 10, borderRadius: 3 }} />
          </View>
          <View className="items-center gap-1.5">
            <SkeletonBlock style={{ width: 38, height: 38, borderRadius: 19 }} />
            <SkeletonBlock style={{ width: 48, height: 10, borderRadius: 3 }} />
          </View>
          <View className="items-center gap-1.5">
            <SkeletonBlock style={{ width: 38, height: 38, borderRadius: 19 }} />
            <SkeletonBlock style={{ width: 36, height: 10, borderRadius: 3 }} />
          </View>
        </View>

        {/* About Card */}
        <View className="mx-4 mb-5 rounded-2xl bg-[#14161c] p-4">
          <SkeletonBlock style={{ width: 130, height: 18, borderRadius: 4, marginBottom: 12 }} />
          <SkeletonBlock style={{ width: '100%', height: 12, borderRadius: 4, marginBottom: 8 }} />
          <SkeletonBlock style={{ width: '92%', height: 12, borderRadius: 4, marginBottom: 8 }} />
          <SkeletonBlock style={{ width: '60%', height: 12, borderRadius: 4, marginBottom: 14 }} />
          <View className="h-[1px] bg-white/10 my-2.5" />
          <View className="gap-2.5 pt-1">
            <View className="flex-row justify-between">
              <SkeletonBlock style={{ width: 60, height: 12, borderRadius: 3 }} />
              <SkeletonBlock style={{ width: 100, height: 12, borderRadius: 3 }} />
            </View>
            <View className="flex-row justify-between">
              <SkeletonBlock style={{ width: 80, height: 12, borderRadius: 3 }} />
              <SkeletonBlock style={{ width: 75, height: 12, borderRadius: 3 }} />
            </View>
            <View className="flex-row justify-between">
              <SkeletonBlock style={{ width: 50, height: 12, borderRadius: 3 }} />
              <SkeletonBlock style={{ width: 120, height: 12, borderRadius: 3 }} />
            </View>
          </View>
        </View>

        {/* Cast Row */}
        <View className="px-4 mb-6">
          <SkeletonBlock style={{ width: 100, height: 18, borderRadius: 4, marginBottom: 12 }} />
          <View className="flex-row gap-3.5">
            {[0, 1, 2, 3].map((idx) => (
              <View key={idx} className="items-center w-[74px]">
                <SkeletonBlock style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 6 }} />
                <SkeletonBlock style={{ width: 54, height: 10, borderRadius: 3, marginBottom: 4 }} />
                <SkeletonBlock style={{ width: 40, height: 8, borderRadius: 3 }} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function DetailsScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isInWatchlist, toggleWatchlist } = useUserData();

  const [media, setMedia] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showOverviewFull, setShowOverviewFull] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollViewRef = useRef<any>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header background fades in after scrolling past 40px, fully opaque by 160px
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [40, 160],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Header title fades in after scrolling past 120px
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [120, 180],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Seasons & Episodes browsing state for TV series
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [seasonEpisodes, setSeasonEpisodes] = useState<FormattedEpisode[]>([]);
  const [isEpisodesLoading, setIsEpisodesLoading] = useState<boolean>(false);

  // Synchronize initial season from first valid season
  useEffect(() => {
    if (media?.seasons && media.seasons.length > 0) {
      const firstValid = media.seasons.find((s) => s.seasonNumber > 0);
      if (firstValid) {
        setSelectedSeason(firstValid.seasonNumber);
      }
    }
  }, [media?.seasons]);

  // Load episodes when selected season changes
  useEffect(() => {
    const rawType = media?.mediaType || type;
    if (!id || rawType !== 'tv') return;

    let isMounted = true;
    setIsEpisodesLoading(true);
    getTvSeasonEpisodes(id, selectedSeason)
      .then((eps) => {
        if (isMounted) setSeasonEpisodes(eps || []);
      })
      .catch(() => {
        if (isMounted) setSeasonEpisodes([]);
      })
      .finally(() => {
        if (isMounted) setIsEpisodesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, media?.mediaType, type, selectedSeason]);

  const validSeasons = useMemo(() => {
    if (!media?.seasons || media.seasons.length === 0) {
      return [{ id: 1, seasonNumber: 1, name: 'Season 1' }];
    }
    const filtered = media.seasons.filter((s) => s.seasonNumber > 0);
    return filtered.length > 0 ? filtered : [{ id: 1, seasonNumber: 1, name: 'Season 1' }];
  }, [media?.seasons]);

  // Tab state between standard Episodes browser and Series Ratings Graph
  const [tvActiveTab, setTvActiveTab] = useState<'episodes' | 'graph'>('episodes');
  const [ratingsGraphData, setRatingsGraphData] = useState<SeriesRatingsGraphData | null>(null);
  const [isGraphLoading, setIsGraphLoading] = useState<boolean>(false);

  // Load ratings graph data when user opens graph tab (or pre-fetches)
  useEffect(() => {
    const rawType = media?.mediaType || type;
    if (!id || rawType !== 'tv') return;
    if (tvActiveTab === 'graph' && !ratingsGraphData && !isGraphLoading) {
      let isMounted = true;
      setIsGraphLoading(true);
      getTvSeriesRatings(id)
        .then((data) => {
          if (isMounted && data) setRatingsGraphData(data);
        })
        .catch((err) => {
          console.warn('[DetailsScreen] error loading ratings graph:', err);
        })
        .finally(() => {
          if (isMounted) setIsGraphLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [id, media?.mediaType, type, tvActiveTab, ratingsGraphData, isGraphLoading]);

  // Load media details
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    const queryType = type === 'tv' ? 'tv' : type === 'movie' ? 'movie' : undefined;

    getMediaDetails(id, queryType)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setError('Content not found');
          return;
        }
        setMedia(data);
      })
      .catch((err) => {
        console.warn('[DetailsScreen] error loading media:', err);
        if (isMounted) setError('Failed to load details');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [id, type]);

  const mediaType = (media?.mediaType || type || 'movie') as 'movie' | 'tv';

  const handleToggleWatchlist = async () => {
    if (!media) return;
    const genresStr = Array.isArray(media.genres)
      ? media.genres.map((g) => (typeof g === 'string' ? g : g.name)).join(', ')
      : undefined;

    const added = await toggleWatchlist({
      mediaId: media.id,
      mediaType: mediaType as any,
      title: media.title,
      posterPath: media.poster,
      backdropPath: media.backdrop,
      logoPath: media.logo,
      logo: media.logo,
      overview: media.overview,
      rating: media.rating,
      voteAverage: media.rating,
      category: genresStr,
      genres: Array.isArray(media.genres) ? media.genres.map((g) => (typeof g === 'string' ? g : g.name)) : undefined,
    });
    showToast(added ? 'Added to Watchlist' : 'Removed from Watchlist');
  };

  const handleShare = async () => {
    if (!media) return;
    try {
      const webUrl = `https://kino-plus.vercel.app/${mediaType === 'tv' ? 'tv' : 'movie'}/${media.id}`;
      await Share.share({
        title: media.title,
        message: `Watch "${media.title}" on Kino+: ${webUrl}`,
        url: webUrl,
      });
    } catch (err) {
      console.warn('[Share] Error sharing:', err);
    }
  };

  const handlePlayTrailer = async (trailerKey?: string) => {
    const key = trailerKey || trailersList[0]?.key;
    if (!key) {
      showToast('No trailer available');
      return;
    }
    const ytUrl = `https://www.youtube.com/watch?v=${key}`;
    try {
      const appUrl = `vnd.youtube:${key}`;
      const canOpenApp = await Linking.canOpenURL(appUrl);
      if (canOpenApp) {
        await Linking.openURL(appUrl);
        return;
      }
    } catch {
      // Fallback
    }

    try {
      await WebBrowser.openBrowserAsync(ytUrl);
    } catch {
      await Linking.openURL(ytUrl);
    }
  };

  if (loading) {
    return <DetailsSkeleton insets={insets} />;
  }

  if (error || !media) {
    return (
      <View className="flex-1 bg-[#0e1013] items-center justify-center p-6">
        <StatusBar barStyle="light-content" />
        <View className="w-16 h-16 rounded-full bg-red-950/60 border border-[#f2545b]/30 items-center justify-center mb-4">
          <Ionicons name="alert-circle-outline" size={36} color={BrandColors.primary} />
        </View>
        <Text className="text-white text-[20px] font-extrabold mb-1">
          {error || 'Content not found'}
        </Text>
        <Text className="text-[#8c93a4] text-[13px] text-center max-w-[260px] mb-6">
          Unable to load this title. Please check your connection or explore other titles.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-[#f2545b] px-6 py-3 rounded-full flex-row items-center gap-2"
          style={({ pressed }) => pressed && s.dim}
        >
          <Ionicons name="arrow-back" size={16} color="#fff" />
          <Text className="text-white text-[14px] font-bold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const inWatchlist = isInWatchlist(mediaType, media.id);
  const year = media.releaseDate ? media.releaseDate.slice(0, 4) : media.releaseYear;

  // Format runtime for movies, season count & total episodes for TV
  let runtimeStr = '';
  let seasonCount = 0;
  let totalEpisodesCount = 0;
  if (mediaType === 'tv') {
    seasonCount =
      media.numberOfSeasons ||
      media.seasons?.filter((s) => s.seasonNumber > 0).length ||
      media.seasons?.length ||
      1;
    totalEpisodesCount =
      media.numberOfEpisodes ||
      media.seasons?.reduce((acc, s) => acc + (s.episodeCount || 0), 0) ||
      0;
    runtimeStr = `${seasonCount} ${seasonCount === 1 ? 'Season' : 'Seasons'}${
      totalEpisodesCount > 0 ? ` • ${totalEpisodesCount} Episodes` : ''
    }`;
  } else if (typeof media.runtime === 'number') {
    const hours = Math.floor(media.runtime / 60);
    const mins = media.runtime % 60;
    runtimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  } else if (media.runtime) {
    runtimeStr = String(media.runtime);
  }

  const genresList = (media.genres || []).map((g) => (typeof g === 'string' ? g : g.name));
  const trailersList = media.trailers || media.videos || [];
  const castList = media.credits?.cast?.slice(0, 14) || [];
  const similarList = media.similar || media.recommendations || [];
  const castWorksList = media.castWorks || [];
  const studioWorksList = media.studioWorks || [];
  const studioName = media.studioName;

  const backdropUri = media.backdrop;

  return (
    <View className="flex-1 bg-[#0a0b0e]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* ── STICKY HEADER BACKGROUND (Fades in smoothly after scrolling a while, NO bottom border) ── */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: (insets.top > 0 ? insets.top : 10) + 52,
          backgroundColor: '#0a0b0e',
          opacity: headerBgOpacity,
          zIndex: 25,
          borderWidth: 0,
          borderBottomWidth: 0,
        }}
        pointerEvents="none"
      />

      {/* ── FLOATING HEADER CONTROLS (Always on top) ── */}
      <View
        className="absolute left-0 right-0 z-30 flex-row items-center justify-between px-3"
        style={{
          top: insets.top > 0 ? insets.top + 2 : 8,
          height: 52,
          borderWidth: 0,
          borderBottomWidth: 0,
        }}
        pointerEvents="box-none"
      >
        {/* Back Button (Clean chevron-back, NO circular background) */}
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center active:opacity-70"
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color="#ffffff"
            style={{
              textShadowColor: 'rgba(0, 0, 0, 0.85)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 6,
            }}
          />
        </Pressable>

        {/* Center Title (fades in as user scrolls down) */}
        <Animated.View
          style={{
            flex: 1,
            marginHorizontal: 8,
            alignItems: 'center',
            opacity: headerTitleOpacity,
          }}
          pointerEvents="none"
        >
          <Text
            numberOfLines={1}
            className="text-white text-[16px] font-bold tracking-tight text-center"
          >
            {media?.title || ''}
          </Text>
        </Animated.View>

        {/* Right Action Icons */}
        <View className="flex-row items-center gap-1">
          {/* Watchlist Bookmark */}
          <Pressable
            onPress={handleToggleWatchlist}
            className="h-10 w-10 items-center justify-center active:opacity-70"
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Watchlist"
          >
            <Ionicons
              name={inWatchlist ? 'checkmark' : 'add'}
              size={24}
              color={inWatchlist ? BrandColors.primary : '#ffffff'}
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.85)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 6,
              }}
            />
          </Pressable>

          {/* Share */}
          <Pressable
            onPress={handleShare}
            className="h-10 w-10 items-center justify-center active:opacity-70"
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <Ionicons
              name="share-outline"
              size={24}
              color="#ffffff"
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.85)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 6,
              }}
            />
          </Pressable>
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* ========================================================
            1. CINEMATIC HERO SECTION
            ======================================================== */}
        <View className="h-[360px] relative overflow-hidden bg-[#16181d]">
          {backdropUri || media.poster ? (
            <ExpoImage
              source={{ uri: backdropUri || media.poster || '' }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
              priority="high"
              cachePolicy="memory-disk"
            />
          ) : (
            <View className="w-full h-full items-center justify-center bg-[#181a20]">
              <Ionicons name="film-outline" size={64} color="#3f3f46" />
            </View>
          )}

          {/* Top subtle vignette for icons */}
          <LinearGradient
            colors={['rgba(10,11,14,0.7)', 'rgba(10,11,14,0.2)', 'transparent']}
            className="absolute top-0 left-0 right-0 h-28"
          />

          {/* Bottom Deep Gradient Transition */}
          <LinearGradient
            colors={['transparent', 'rgba(10,11,14,0.3)', 'rgba(10,11,14,0.85)', '#0a0b0e']}
            locations={[0, 0.45, 0.8, 1]}
            className="absolute bottom-0 left-0 right-0 h-56"
          />
        </View>

        {/* ========================================================
            2. POSTER, TITLE & QUICK BADGES
            ======================================================== */}
        <View className="px-4 -mt-16 z-10 mb-4">
          <View className="flex-row gap-3.5 items-end mb-3">
            {/* Movie Poster Card */}
            {(media.poster || backdropUri) ? (
              <View
                className="w-[104px] h-[154px] rounded-xl overflow-hidden bg-[#16181d] shadow-2xl shrink-0"
                style={s.shadowCard}
              >
                <ExpoImage
                  source={{ uri: media.poster || backdropUri || '' }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              </View>
            ) : null}

            {/* Title & Metadata beside Poster */}
            <View className="flex-1 justify-end pb-0.5">
              {media.logo ? (
                <View className="mb-2">
                  <ExpoImage
                    source={{ uri: media.logo }}
                    style={{ width: 180, height: 48 }}
                    contentFit="contain"
                    transition={150}
                    cachePolicy="memory-disk"
                  />
                </View>
              ) : (
                <Text
                  className="text-white text-[22px] font-black tracking-tight leading-7 mb-1"
                  numberOfLines={3}
                >
                  {media.title}
                </Text>
              )}

              {/* Tagline */}
              {media.tagline ? (
                <Text className="text-white/60 text-[12px] italic leading-4 mb-2" numberOfLines={2}>
                  "{media.tagline}"
                </Text>
              ) : null}

              {/* Format, Cert & Year row */}
              <View className="flex-row items-center flex-wrap gap-1.5">
                <View className="bg-[#f2545b] px-2 py-0.5 rounded">
                  <Text className="text-white text-[10px] font-black tracking-wider uppercase">
                    {mediaType === 'tv' ? 'TV SERIES' : 'MOVIE'}
                  </Text>
                </View>
                {media.certification ? (
                  <View className="bg-white/10 px-1.5 py-0.5 rounded">
                    <Text className="text-white text-[10px] font-bold uppercase">{media.certification}</Text>
                  </View>
                ) : null}
                {year ? <Text className="text-[#8c93a4] text-[12px] font-bold">{year}</Text> : null}
                {runtimeStr ? (
                  <>
                    <Text className="text-[#8c93a4] text-[12px]">•</Text>
                    <Text className="text-[#8c93a4] text-[12px] font-bold">{runtimeStr}</Text>
                  </>
                ) : null}
              </View>
            </View>
          </View>

          {/* Clean Rating Badge */}
          {media.rating > 0 ? (
            <View className="flex-row items-center pt-1">
              <View className="flex-row items-center bg-[#f5c518]/15 px-2.5 py-1 rounded-lg">
                <Ionicons name="star" size={12} color="#f5c518" style={{ marginRight: 3.5 }} />
                <Text className="text-[#f5c518] text-[12.5px] font-black">{media.rating.toFixed(1)}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* GENRE PILLS */}
        {genresList.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            className="mb-4"
          >
            {genresList.map((g: string) => (
              <View
                key={g}
                className="bg-[#14161b] rounded-full px-3 py-1"
              >
                <Text className="text-zinc-300 text-[11.5px] font-semibold">{g}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ========================================================
            3. WATCH TRAILER ACTION
            ======================================================== */}
        <View className="px-4 mb-4">
          <View className="flex-row items-center gap-2.5">
            <Pressable
              onPress={() => handlePlayTrailer()}
              className="flex-1 h-12 rounded-xl bg-[#f2545b] flex-row items-center justify-center gap-2 active:opacity-85 shadow-lg"
              style={s.shadowPrimary}
            >
              <Ionicons name="play" size={20} color="#fff" style={{ marginLeft: 2 }} />
              <Text className="text-white text-[15px] font-black tracking-wide">
                Watch Trailer
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ========================================================
            4. SECONDARY QUICK ACTIONS BAR
            ======================================================== */}
        <View className="flex-row justify-around px-3 py-3 mb-4 bg-[#14161c] mx-4 rounded-2xl">
          {/* 1. Watchlist */}
          <Pressable
            onPress={handleToggleWatchlist}
            className="items-center gap-1"
            style={({ pressed }) => pressed && s.dim}
          >
            <View
              className={`w-9.5 h-9.5 rounded-full items-center justify-center ${
                inWatchlist ? 'bg-[#f2545b]' : 'bg-white/8'
              }`}
            >
              <Ionicons
                name={inWatchlist ? 'checkmark' : 'add'}
                size={18}
                color="#fff"
              />
            </View>
            <Text
              className={`text-[10.5px] font-semibold ${
                inWatchlist ? 'text-[#f2545b]' : 'text-[#8c93a4]'
              }`}
            >
              {inWatchlist ? 'Saved' : 'Watchlist'}
            </Text>
          </Pressable>

          {/* 2. Share */}
          <Pressable
            onPress={handleShare}
            className="items-center gap-1"
            style={({ pressed }) => pressed && s.dim}
          >
            <View className="w-9.5 h-9.5 rounded-full bg-white/8 items-center justify-center">
              <Ionicons name="share-social-outline" size={18} color="#fff" />
            </View>
            <Text className="text-[#8c93a4] text-[10.5px] font-semibold">Share</Text>
          </Pressable>
        </View>

        {/* ========================================================
            4.1 WHERE TO WATCH (STREAMING / JUSTWATCH)
            ======================================================== */}
        <WatchProviders
          mediaId={media.id}
          mediaType={mediaType as any}
        />

        {/* ========================================================
            4.5 SEASONS & EPISODES / RATINGS GRAPH (TV SERIES ONLY)
            ======================================================== */}
        {mediaType === 'tv' && (
          <View className="mb-6">
            {/* Header: Segmented Switcher (Episodes / Series Graph) */}
            <View className="flex-row items-center justify-between px-4 mb-3">
              <View className="flex-row items-center bg-[#14161c] p-1 rounded-xl">
                <Pressable
                  onPress={() => setTvActiveTab('episodes')}
                  className={`px-3 py-1.5 rounded-lg active:opacity-80 flex-row items-center gap-1.5 ${
                    tvActiveTab === 'episodes' ? 'bg-[#f2545b]' : 'bg-transparent'
                  }`}
                >
                  <Ionicons
                    name="film-outline"
                    size={13}
                    color={tvActiveTab === 'episodes' ? '#ffffff' : '#8c93a4'}
                  />
                  <Text
                    className={`text-[12.5px] font-bold ${
                      tvActiveTab === 'episodes' ? 'text-white' : 'text-[#8c93a4]'
                    }`}
                  >
                    Episodes
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setTvActiveTab('graph')}
                  className={`px-3 py-1.5 rounded-lg active:opacity-80 flex-row items-center gap-1.5 ${
                    tvActiveTab === 'graph' ? 'bg-[#f2545b]' : 'bg-transparent'
                  }`}
                >
                  <Ionicons
                    name="stats-chart"
                    size={13}
                    color={tvActiveTab === 'graph' ? '#ffffff' : '#8c93a4'}
                  />
                  <Text
                    className={`text-[12.5px] font-bold ${
                      tvActiveTab === 'graph' ? 'text-white' : 'text-[#8c93a4]'
                    }`}
                  >
                    Series Graph
                  </Text>
                </Pressable>
              </View>

              <View className="flex-row items-center gap-2">
                {tvActiveTab === 'graph' && ratingsGraphData?.overallAverage ? (
                  <View className="flex-row items-center gap-1 bg-[#14161c] px-2.5 py-1 rounded-md">
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text className="text-white text-[11.5px] font-bold">
                      {ratingsGraphData.overallAverage.toFixed(1)} Avg
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* TAB 1: EPISODES */}
            {tvActiveTab === 'episodes' && (
              <>
                {/* Season Selector Tabs */}
                {validSeasons.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                    className="mb-3"
                  >
                    {validSeasons.map((s) => {
                      const isSelected = selectedSeason === s.seasonNumber;
                      return (
                        <Pressable
                          key={s.id || s.seasonNumber}
                          onPress={() => setSelectedSeason(s.seasonNumber)}
                          className={`px-4 py-2 rounded-full active:opacity-80 ${
                            isSelected ? 'bg-[#f2545b]' : 'bg-[#14161c]'
                          }`}
                        >
                          <Text
                            className={`text-[12.5px] font-bold ${
                              isSelected ? 'text-white' : 'text-[#8c93a4]'
                            }`}
                          >
                            Season {s.seasonNumber}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}

                {/* Episodes List / Carousel */}
                {isEpisodesLoading ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                  >
                    {[1, 2, 3].map((idx) => (
                      <View key={idx} style={{ width: 220 }}>
                        <View
                          style={{
                            width: 220,
                            height: 124,
                            borderRadius: 12,
                            backgroundColor: '#181a22',
                          }}
                        />
                        <View
                          style={{
                            width: 140,
                            height: 14,
                            borderRadius: 4,
                            backgroundColor: '#1e212b',
                            marginTop: 8,
                          }}
                        />
                        <View
                          style={{
                            width: 80,
                            height: 10,
                            borderRadius: 3,
                            backgroundColor: '#191b24',
                            marginTop: 5,
                          }}
                        />
                      </View>
                    ))}
                  </ScrollView>
                ) : seasonEpisodes.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                  >
                    {seasonEpisodes.map((ep) => {
                      const epImage = ep.still || media.backdrop || media.poster;

                      return (
                        <Pressable
                          key={ep.id || ep.episodeNumber}
                          onPress={() => {
                            handlePlayTrailer();
                          }}
                          style={{ width: 220 }}
                          className="active:opacity-85"
                        >
                          {/* 16:9 Episode Thumbnail */}
                          <View className="relative w-full h-[124px] rounded-xl overflow-hidden bg-[#181a20]">
                            {epImage ? (
                              <ExpoImage
                                source={{ uri: epImage }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                                transition={150}
                                cachePolicy="memory-disk"
                              />
                            ) : (
                              <View className="w-full h-full items-center justify-center bg-[#181a20]">
                                <Ionicons name="tv-outline" size={32} color="#3f3f46" />
                              </View>
                            )}

                            {/* Dark Gradient Overlay for Badges */}
                            <LinearGradient
                              colors={['transparent', 'rgba(0,0,0,0.75)']}
                              className="absolute inset-0"
                            />

                            {/* Top-left: Episode Number Pill */}
                            <View className="absolute top-2 left-2 bg-black/75 px-2 py-0.5 rounded-md">
                              <Text className="text-white text-[10px] font-black">
                                EP {ep.episodeNumber}
                              </Text>
                            </View>

                            {/* Top-right: Runtime Pill */}
                            {ep.runtime > 0 && (
                              <View className="absolute top-2 right-2 bg-black/75 px-2 py-0.5 rounded-md">
                                <Text className="text-zinc-300 text-[10px] font-semibold">
                                  {ep.runtime}m
                                </Text>
                              </View>
                            )}

                            {/* Play Button Icon */}
                            <View className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#f2545b] items-center justify-center shadow-md">
                              <Ionicons name="play" size={14} color="#ffffff" style={{ marginLeft: 1 }} />
                            </View>
                          </View>

                          {/* Episode Title & Overview */}
                          <View className="mt-2">
                            <Text
                              className="text-white text-[13.5px] font-bold tracking-tight"
                              numberOfLines={1}
                            >
                              {ep.episodeNumber}. {ep.name || `Episode ${ep.episodeNumber}`}
                            </Text>
                            {ep.overview ? (
                              <Text
                                className="text-[#8c93a4] text-[11.5px] leading-4 mt-1"
                                numberOfLines={2}
                              >
                                {ep.overview}
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <View className="px-4 py-2">
                    <Text className="text-[#6d7589] text-[13px]">
                      No episodes available for Season {selectedSeason}.
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* TAB 2: RATINGS GRAPH */}
            {tvActiveTab === 'graph' && (
              <View>
                {isGraphLoading ? (
                  <View className="py-12 items-center justify-center gap-2">
                    <ActivityIndicator size="small" color="#f2545b" />
                    <Text className="text-[#8c93a4] text-xs">
                      Loading series ratings graph...
                    </Text>
                  </View>
                ) : ratingsGraphData ? (
                  <SeriesRatingsGraph
                    data={ratingsGraphData}
                    onSelectEpisode={() => {
                      handlePlayTrailer();
                    }}
                  />
                ) : (
                  <View className="px-4 py-8 items-center justify-center gap-2">
                    <Ionicons name="stats-chart-outline" size={32} color="#5a6070" />
                    <Text className="text-[#8c93a4] text-xs">
                      Ratings graph unavailable for this series.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ========================================================
            5. ABOUT THE MOVIE / ABOUT THE SERIES
            ======================================================== */}
        <View className="mx-4 mb-5 rounded-2xl bg-[#14161c] p-4">
          <Text className="text-white text-[17px] font-extrabold tracking-tight mb-2.5">
            {mediaType === 'tv' ? 'About the Series' : 'About the Movie'}
          </Text>

          {/* Synopsis */}
          {media.overview ? (
            <View className="mb-3">
              <Text
                className="text-zinc-300 text-[13.5px] leading-5.5"
                numberOfLines={showOverviewFull ? undefined : 4}
              >
                {media.overview}
              </Text>
              {media.overview.length > 170 && (
                <Pressable
                  onPress={() => setShowOverviewFull(!showOverviewFull)}
                  className="mt-1.5 self-start"
                  hitSlop={8}
                >
                  <Text className="text-[#f2545b] text-[12px] font-bold">
                    {showOverviewFull ? 'Show Less' : 'Read More'}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null}

          {/* Information Grid */}
          <View className="pt-2 gap-2">
            <View className="h-[1px] bg-white/10 mb-1" />

            {(media.director || media.creator) && (
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-[#8c93a4] text-[12.5px] font-medium">
                  {media.director ? 'Director' : 'Creator'}
                </Text>
                <Text className="text-white text-[12.5px] font-bold flex-1 text-right ml-4">
                  {media.director || media.creator}
                </Text>
              </View>
            )}

            {media.releaseDate && (
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-[#8c93a4] text-[12.5px] font-medium">Release Date</Text>
                <Text className="text-white text-[12.5px] font-bold flex-1 text-right ml-4">
                  {media.releaseDate}
                </Text>
              </View>
            )}

            {mediaType === 'tv' ? (
              <>
                {seasonCount > 0 ? (
                  <View className="flex-row items-center justify-between py-1">
                    <Text className="text-[#8c93a4] text-[12.5px] font-medium">Total Seasons</Text>
                    <Text className="text-white text-[12.5px] font-bold flex-1 text-right ml-4">
                      {seasonCount} {seasonCount === 1 ? 'Season' : 'Seasons'}
                    </Text>
                  </View>
                ) : null}
                {totalEpisodesCount > 0 ? (
                  <View className="flex-row items-center justify-between py-1">
                    <Text className="text-[#8c93a4] text-[12.5px] font-medium">Total Episodes</Text>
                    <Text className="text-white text-[12.5px] font-bold flex-1 text-right ml-4">
                      {totalEpisodesCount} Episodes
                    </Text>
                  </View>
                ) : null}
              </>
            ) : runtimeStr ? (
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-[#8c93a4] text-[12.5px] font-medium">Duration</Text>
                <Text className="text-white text-[12.5px] font-bold flex-1 text-right ml-4">
                  {runtimeStr}
                </Text>
              </View>
            ) : null}

            {genresList.length > 0 && (
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-[#8c93a4] text-[12.5px] font-medium">Genres</Text>
                <Text className="text-white text-[12.5px] font-bold flex-1 text-right ml-4" numberOfLines={1}>
                  {genresList.join(', ')}
                </Text>
              </View>
            )}

            {studioName && (
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-[#8c93a4] text-[12.5px] font-medium">Studio</Text>
                <Text className="text-white text-[12.5px] font-bold flex-1 text-right ml-4" numberOfLines={1}>
                  {studioName}
                </Text>
              </View>
            )}

            {media.certification && (
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-[#8c93a4] text-[12.5px] font-medium">Content Rating</Text>
                <Text className="text-white text-[12.5px] font-bold uppercase flex-1 text-right ml-4">
                  {media.certification}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ========================================================
            6. CAST & CREW SECTION
            ======================================================== */}
        {castList.length > 0 && (
          <View className="px-4 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-[18px] font-extrabold tracking-tight">
                Cast & Crew
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingRight: 16 }}
            >
              {castList.map((item, index) => (
                <View
                  key={`cast-${item.id || index}`}
                  className="items-center w-[74px]"
                >
                  <View className="w-16 h-16 rounded-full bg-[#16181d] overflow-hidden mb-2 items-center justify-center">
                    {item.profilePath ? (
                      <ExpoImage
                        source={{ uri: item.profilePath }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <Text className="text-[#f2545b] text-[20px] font-black">
                        {item.name ? item.name.charAt(0) : '?'}
                      </Text>
                    )}
                  </View>
                  <Text
                    className="text-white text-[11px] font-bold text-center leading-3.5"
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  {item.character ? (
                    <Text
                      className="text-[#8c93a4] text-[10px] text-center mt-0.5 leading-3"
                      numberOfLines={1}
                    >
                      {item.character}
                    </Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========================================================
            8. TRAILERS & EXTRAS
            ======================================================== */}
        {trailersList.length > 0 && (
          <View className="px-4 mb-6">
            <Text className="text-white text-[18px] font-extrabold tracking-tight mb-3">
              Trailers & Extras
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 16 }}
            >
              {trailersList.map((item) => {
                const trailerThumb =
                  ('thumbnail' in item && item.thumbnail) ||
                  (item.key ? `https://img.youtube.com/vi/${item.key}/hqdefault.jpg` : null);
                return (
                <Pressable
                  key={`trailer-${item.id}`}
                  onPress={() => handlePlayTrailer(item.key)}
                  className="w-56"
                  style={({ pressed }) => pressed && s.dim}
                >
                  <View className="w-full aspect-video rounded-xl bg-[#16181d] overflow-hidden mb-2 relative">
                    {trailerThumb ? (
                      <ExpoImage
                        source={{ uri: trailerThumb }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-[#16181d]">
                        <Ionicons name="film-outline" size={28} color="#71717a" />
                      </View>
                    )}

                    {/* Centered play badge */}
                    <View className="absolute inset-0 items-center justify-center bg-black/40">
                      <View className="w-10 h-10 rounded-full bg-black/75 items-center justify-center">
                        <Ionicons name="play" size={18} color="#fff" style={{ marginLeft: 2 }} />
                      </View>
                    </View>

                    {/* Video Type Badge */}
                    {item.type && (
                      <View className="absolute bottom-1.5 left-1.5 bg-black/80 px-2 py-0.5 rounded">
                        <Text className="text-white text-[9px] font-bold uppercase">
                          {item.type}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-white text-[13px] font-bold mb-0.5" numberOfLines={2}>
                    {item.name}
                  </Text>
                </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ========================================================
            9. TITLES YOU MIGHT LIKE (SIMILAR & RECOMMENDED)
            ======================================================== */}
        {similarList.length > 0 && (
          <View className="px-4 mb-6">
            <Text className="text-white text-[18px] font-extrabold tracking-tight mb-3">
              Titles You Might Like
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 16 }}
            >
              {similarList.map((item) => (
                <Pressable
                  key={`similar-${item.id}`}
                  onPress={() =>
                    router.push({
                      pathname: '/details/[id]',
                      params: { id: String(item.id), type: item.mediaType || mediaType },
                    })
                  }
                  className="w-32"
                  style={({ pressed }) => pressed && s.dim}
                >
                  <View className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#16181d] mb-1.5 relative">
                    {item.poster ? (
                      <ExpoImage
                        source={{ uri: item.poster }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-[#16181d]">
                        <Text className="text-[#8c93a4] text-[11px]">No Poster</Text>
                      </View>
                    )}

                    {/* Rating badge */}
                    {item.rating > 0 && (
                      <View className="absolute top-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded flex-row items-center gap-0.5">
                        <Ionicons name="star" size={10} color="#f5c518" />
                        <Text className="text-white text-[10px] font-bold">
                          {item.rating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-white text-[12px] font-bold leading-4" numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.releaseDate && (
                    <Text className="text-[#8c93a4] text-[10px] mt-0.5">
                      {item.releaseDate.slice(0, 4)}
                    </Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========================================================
            10. MORE FROM THIS CAST (TV Shows)
            ======================================================== */}
        {mediaType === 'tv' && castWorksList.length > 0 && (
          <View className="px-4 mb-6">
            <Text className="text-white text-[18px] font-extrabold tracking-tight mb-3">
              More From This Cast
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 16 }}
            >
              {castWorksList.map((item) => (
                <Pressable
                  key={`castWorks-${item.id}`}
                  onPress={() =>
                    router.push({
                      pathname: '/details/[id]',
                      params: { id: String(item.id), type: item.mediaType || 'tv' },
                    })
                  }
                  className="w-32"
                  style={({ pressed }) => pressed && s.dim}
                >
                  <View className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#16181d] mb-1.5">
                    {item.poster ? (
                      <ExpoImage
                        source={{ uri: item.poster }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-[#16181d]">
                        <Text className="text-[#8c93a4] text-[11px]">No Poster</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-white text-[12px] font-bold leading-4" numberOfLines={2}>
                    {item.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========================================================
            11. MORE FROM STUDIO
            ======================================================== */}
        {studioWorksList.length > 0 && (
          <View className="px-4 mb-6">
            <Text className="text-white text-[18px] font-extrabold tracking-tight mb-3">
              More From {studioName || 'Studio'}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 16 }}
            >
              {studioWorksList.map((item) => (
                <Pressable
                  key={`studioWorks-${item.id}`}
                  onPress={() =>
                    router.push({
                      pathname: '/details/[id]',
                      params: { id: String(item.id), type: item.mediaType || mediaType },
                    })
                  }
                  className="w-32"
                  style={({ pressed }) => pressed && s.dim}
                >
                  <View className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#16181d] mb-1.5">
                    {item.poster ? (
                      <ExpoImage
                        source={{ uri: item.poster }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-[#16181d]">
                        <Text className="text-[#8c93a4] text-[11px]">No Poster</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-white text-[12px] font-bold leading-4" numberOfLines={2}>
                    {item.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </Animated.ScrollView>

      {/* ========================================================
          13. FLOATING TOAST NOTIFICATION
          ======================================================== */}
      {toastMessage && (
        <View
          className="absolute self-center bg-[#1e2026] border border-white/20 px-5 py-2.5 rounded-full flex-row items-center gap-2 z-50 shadow-2xl"
          style={{ bottom: insets.bottom + 24 }}
        >
          <Ionicons name="checkmark-circle" size={18} color="#10b981" />
          <Text className="text-white text-[13px] font-bold">{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

