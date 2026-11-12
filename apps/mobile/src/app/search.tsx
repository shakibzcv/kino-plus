import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StatusBar,
  Keyboard,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { BottomTabInset, BrandColors } from '@/constants/theme';
import {
  searchMedia,
  TrendingMovie,
} from '@/services/movies';
import { useUserData } from '@/context/user-data-context';
import { HeaderSearchBar } from '@/components/header-search-bar';
import { VoiceSearchModal } from '@/components/voice-search-modal';

type FilterType = 'All' | 'Movies' | 'TV Shows';
const FILTERS: FilterType[] = ['All', 'Movies', 'TV Shows'];



function resolvePosterUrl(item: any): string | null {
  const raw =
    item.poster ||
    item.posterPath ||
    item.poster_path ||
    item.backdrop ||
    item.backdropPath ||
    item.backdrop_path;

  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w500${trimmed}`;
  }
  return `https://image.tmdb.org/t/p/w500/${trimmed}`;
}

const SearchResultCard = React.memo(function SearchResultCard({
  item,
  onPress,
}: {
  item: TrendingMovie;
  onPress: (item: TrendingMovie) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const posterUrl = resolvePosterUrl(item);
  const year = item.releaseDate ? item.releaseDate.slice(0, 4) : null;

  return (
    <Pressable
      onPress={() => onPress(item)}
      className="w-full flex-row items-center px-4 py-3 bg-[#0e1013] active:bg-[#14161d]"
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      {/* Poster Thumbnail matching Watchlist */}
      <View className="w-[72px] h-[106px] rounded-lg overflow-hidden bg-[#1b1d22] relative mr-3.5 shrink-0">
        {posterUrl && !imageError ? (
          <ExpoImage
            source={{ uri: posterUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            onError={() => setImageError(true)}
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-[#1b1d22]">
            <Ionicons
              name={item.mediaType === 'tv' ? 'tv-outline' : 'film-outline'}
              size={26}
              color="#5e6576"
            />
          </View>
        )}
      </View>

      {/* Content Info matching Watchlist — fills poster height */}
      <View className="flex-1 justify-center min-h-[106px] overflow-hidden">
        <Text
          className="text-white text-[15px] font-bold leading-5 tracking-tight"
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <View className="flex-row items-center gap-2 mt-1 mb-1">
          {item.rating > 0 && (
            <View className="flex-row items-center gap-1 bg-white/7 px-1.5 py-0.5 rounded-full">
              <Ionicons name="star" size={10} color="#f5c518" />
              <Text className="text-white text-[11px] font-bold">
                {item.rating.toFixed(1)}
              </Text>
            </View>
          )}
          <Text className="text-[11px] font-medium text-[#8a91a0] uppercase tracking-wider">
            {item.mediaType === 'tv' ? 'TV Show' : 'Movie'}
          </Text>
          {year ? (
            <Text className="text-[11px] font-medium text-[#8a91a0]">
              · {year}
            </Text>
          ) : null}
        </View>

        {item.overview ? (
          <Text
            className="text-[#8a91a0] text-[12px] leading-[16.5px]"
            numberOfLines={3}
          >
            {item.overview}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

function ResultSkeleton() {
  return (
    <View className="flex-row items-center px-4 py-3 gap-3.5">
      <View className="w-[72px] h-[106px] rounded-lg bg-white/8 animate-pulse" />
      <View className="flex-1 gap-2">
        <View className="h-4 w-4/5 rounded-md bg-white/8" />
        <View className="h-3 w-1/3 rounded-md bg-white/5" />
        <View className="h-3 w-full rounded-md bg-white/5 mt-1" />
        <View className="h-3 w-3/4 rounded-md bg-white/5" />
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { searchHistory, addSearchHistory, clearSearchHistory } = useUserData();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [results, setResults] = useState<TrendingMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      const clean = q.trim();
      if (!clean) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setHasSearched(true);
      try {
        const res = await searchMedia(clean);
        if (!controller.signal.aborted) {
          setResults(res.results ?? []);
          if (res.results && res.results.length > 0) {
            addSearchHistory(clean);
          }
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [addSearchHistory]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const filteredResults = results.filter((r) => {
    if (activeFilter === 'Movies') return r.mediaType === 'movie';
    if (activeFilter === 'TV Shows') return r.mediaType === 'tv';
    return true;
  });

  const handleQueryPress = (term: string) => {
    setQuery(term);
    addSearchHistory(term);
    doSearch(term);
  };

  const handleResultPress = (item: TrendingMovie) => {
    if (query.trim()) {
      addSearchHistory(query.trim());
    }
    Keyboard.dismiss();
    router.push({
      pathname: '/details/[id]',
      params: { id: String(item.id), type: item.mediaType },
    });
  };

  const showResults = query.trim().length > 0;
  const recentHistoryList = searchHistory.slice(0, 6);

  return (
    <View className="flex-1 bg-[#0e1013]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <View className="flex-1">
        {/* ── Top Search Header Bar ── */}
        <View
          className="px-4 pb-2 bg-[#0e1013]"
          style={{ paddingTop: insets.top > 0 ? insets.top + 6 : 14 }}
        >
          <HeaderSearchBar
            value={query}
            onChangeText={setQuery}
            onClose={() => router.back()}
            placeholder="Type to search"
            showVoiceIcon={false}
            showAudioButton={true}
            onAudioPress={() => setIsVoiceOpen(true)}
            onVoicePress={() => setIsVoiceOpen(true)}
            isLoading={isLoading}
            onSubmitEditing={() => {
              if (query.trim()) {
                addSearchHistory(query.trim());
                doSearch(query);
              }
            }}
          />

          {/* Filter tabs — only shown when search query is active */}
          {showResults && (
            <View className="flex-row gap-2 mt-2.5">
              {FILTERS.map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setActiveFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full border ${
                    activeFilter === f
                      ? 'bg-[#f2545b] border-[#f2545b]'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <Text
                    className={`text-[12px] font-bold ${
                      activeFilter === f ? 'text-white' : 'text-[#7a8194]'
                    }`}
                  >
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ── Body ── */}
        {!showResults ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: insets.bottom + BottomTabInset + 24,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Recent Searches Header & List */}
            {recentHistoryList.length > 0 ? (
              <>
                <View className="flex-row items-center justify-between mb-3.5">
                  <Text className="text-[17px] font-bold text-white tracking-tight">
                    Recent searches
                  </Text>
                  {searchHistory.length > 0 && (
                    <Pressable
                      onPress={() => clearSearchHistory()}
                      hitSlop={8}
                      className="active:opacity-70"
                    >
                      <Text className="text-[12px] font-semibold text-[#f2545b]">
                        Clear
                      </Text>
                    </Pressable>
                  )}
                </View>

                <View className="mb-6">
                  {recentHistoryList.map((term, index) => (
                    <Pressable
                      key={`hist-${term}-${index}`}
                      onPress={() => handleQueryPress(term)}
                      className="flex-row items-center py-3.5 active:opacity-70"
                    >
                      <Ionicons name="time-outline" size={22} color="#ffffff" />
                      <Text className="flex-1 text-white text-[15px] font-normal ml-4" numberOfLines={1}>
                        {term}
                      </Text>
                      <MaterialIcons name="north-east" size={20} color="#ffffff" />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <View className="flex-1 items-center justify-center pt-28">
                <Ionicons name="search-outline" size={44} color="#3b3f4d" />
                <Text className="text-white text-[16px] font-bold mt-3">
                  Search Movies & Shows
                </Text>
                <Text className="text-[#6d7589] text-[13px] mt-1 text-center max-w-[260px]">
                  Find your favorite blockbusters, TV series, and genres
                </Text>
              </View>
            )}
          </ScrollView>
        ) : isLoading ? (
          /* Skeleton loading */
          <View className="flex-1" style={{ paddingBottom: insets.bottom + BottomTabInset }}>
            <View className="px-4 pt-4 pb-2">
              <View className="h-3 w-40 rounded bg-white/8" />
            </View>
            {Array.from({ length: 8 }).map((_, i) => (
              <ResultSkeleton key={i} />
            ))}
          </View>
        ) : filteredResults.length === 0 && hasSearched ? (
          /* Empty state */
          <View className="flex-1 items-center justify-center pb-24">
            <Ionicons name="search-outline" size={48} color="#2a2d35" />
            <Text className="text-white text-[17px] font-bold mt-4">No results found</Text>
            <Text className="text-[#4b5166] text-[13px] mt-1.5 text-center px-8">
              Try different keywords or check the spelling
            </Text>
          </View>
        ) : (
          <FlashList
            data={filteredResults}
            keyExtractor={(item) => `${item.id}-${item.mediaType}`}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 16 }}
            ListHeaderComponent={
              <View className="px-4 pt-4 pb-1">
                <Text className="text-[13px] font-medium text-[#8a91a0]">
                  {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'} for &quot;{query}&quot;
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <SearchResultCard item={item} onPress={handleResultPress} />
            )}
          />
        )}
      </View>

      {/* ── Voice Search Overlay Modal ── */}
      <VoiceSearchModal
        visible={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSpeechResult={(spokenText) => {
          setQuery(spokenText);
          addSearchHistory(spokenText);
          doSearch(spokenText);
        }}
      />
    </View>
  );
}
