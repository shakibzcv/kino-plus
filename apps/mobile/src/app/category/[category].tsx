import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { BottomTabInset, BrandColors, MaxContentWidth } from '@/constants/theme';
import { getCategoryMedia, TrendingMovie } from '@/services/movies';

export default function CategoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  
  const [movies, setMovies] = useState<TrendingMovie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadCategoryMovies = useCallback(async () => {
    if (!category) return;
    
    setApiError(null);
    try {
      const result = await getCategoryMedia(category);
      setMovies(result.items || []);
    } catch (err) {
      console.warn('[CategoryDetail] Error loading movies:', err);
      setApiError('Couldn\'t load movies for this category. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [category]);

  useEffect(() => {
    loadCategoryMovies();
  }, [loadCategoryMovies]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCategoryMovies();
  }, [loadCategoryMovies]);

  const handleMoviePress = (item: TrendingMovie) => {
    const rawType = item.mediaType;
    const type = rawType === 'tv' ? 'tv' : rawType === 'movie' ? 'movie' : undefined;
    router.push({
      pathname: '/details/[id]',
      params: {
        id: String(item.id),
        ...(type ? { type } : {}),
      },
    });
  };

  const renderItem = useCallback(({ item }: { item: TrendingMovie }) => {
    const poster = item.poster || item.backdrop || 'https://image.tmdb.org/t/p/w342/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg';
    const year = item.releaseDate ? item.releaseDate.slice(0, 4) : '2024';
    
    return (
      <Pressable
        onPress={() => handleMoviePress(item)}
        className="w-[124px] gap-1 active:opacity-75 active:scale-[0.985]"
      >
        <View className="relative h-[184px] w-[124px] overflow-hidden rounded-xl bg-[#1b1d22]">
          <ExpoImage
            source={{ uri: poster }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          {item.rating > 0 && (
            <View className="absolute top-1.5 right-1.5 flex-row items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5">
              <Ionicons name="star" size={10} color="#ffb703" />
              <Text className="text-[10px] font-bold text-white">{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        <Text className="mt-0.5 text-[13px] font-semibold leading-[17px] text-white" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-[11px] font-medium text-[#8a91a0]">{year}</Text>
      </Pressable>
    );
  }, [router]);

  const bottomPad = insets.bottom + BottomTabInset + 16;

  return (
    <View className="flex-1 bg-[#0a0b0e]">
      <StatusBar barStyle="light-content" backgroundColor="#0a0b0e" translucent={false} />
      
      {/* Header */}
      <View className="bg-[#0a0b0e] px-4 pb-2.5" style={{ paddingTop: insets.top > 0 ? insets.top + 4 : 10 }}>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-11 w-11 items-center justify-center active:opacity-75"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={26} color="#ffffff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-[20px] font-extrabold text-white tracking-tight">
              {category || 'Category'}
            </Text>
            <Text className="text-[12px] text-[#8a91a0]">
              {movies.length} {movies.length === 1 ? 'title' : 'titles'} available
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {apiError ? (
        <View className="flex-1 items-center justify-center gap-3 py-16">
          <Ionicons name="cloud-offline-outline" size={44} color="#f2545b" />
          <Text className="text-[20px] font-extrabold text-white mt-2">Couldn't load movies</Text>
          <Text className="text-[13px] text-[#9aa0ad]">{apiError}</Text>
          <Pressable
            onPress={() => {
              setIsLoading(true);
              loadCategoryMovies();
            }}
            className="mt-2 self-center rounded-full bg-[#f2545b] px-5 py-2.5 active:opacity-80"
          >
            <Text className="text-white font-bold">Retry</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center gap-3 py-16">
          <ActivityIndicator size="large" color="#f2545b" />
          <Text className="text-[13px] text-[#9aa0ad]">Loading {category} movies...</Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => `cat-movie-${item.id}`}
          renderItem={renderItem}
          numColumns={3}
          columnWrapperClassName="gap-3"
          contentContainerClassName="px-3 pt-3"
          contentContainerStyle={{ paddingBottom: bottomPad }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#f2545b"
              colors={['#f2545b']}
            />
          }
          initialNumToRender={9}
          maxToRenderPerBatch={6}
          windowSize={3}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <View className="items-center justify-center gap-2.5 py-16">
              <Ionicons name="film-outline" size={44} color="#757c8d" />
              <Text className="text-[14px] text-[#757c8d]">No movies found in this category</Text>
            </View>
          }
        />
      )}
    </View>
  );
}