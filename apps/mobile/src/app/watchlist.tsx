import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StatusBar,
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Platform,
  UIManager,
  LayoutAnimation,
  BackHandler,
  Keyboard,
  PanResponder,
  type LayoutChangeEvent,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useUserData } from '@/context/user-data-context';
import { BottomTabInset, BrandColors } from '@/constants/theme';
import { WatchlistItem } from '@/services/user-data';
import { HeaderSearchBar } from '@/components/header-search-bar';
import { EmptyState } from '@/components/empty-state';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_WIDTH = 90;
const SWIPE_THRESHOLD = 35;

function resolvePosterUrl(item: WatchlistItem): string | null {
  const raw =
    item.posterPath ||
    (item as any).poster ||
    (item as any).poster_path ||
    item.backdropPath ||
    (item as any).backdrop ||
    (item as any).backdrop_path;

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

interface WatchlistCardProps {
  item: WatchlistItem;
  onPress: (item: WatchlistItem) => void;
  onRemove: (item: WatchlistItem) => void;
}

const WatchlistCard = React.memo(function WatchlistCard({
  item,
  onPress,
  onRemove,
}: WatchlistCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const isOpenRef = useRef(false);
  const posterUrl = resolvePosterUrl(item);

  const actualHeightRef = useRef<number>(132);
  const translateX = useRef(new Animated.Value(0)).current;
  const rowOpacity = useRef(new Animated.Value(1)).current;
  const rowHeight = useRef(new Animated.Value(132)).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && !isRemoving) {
      actualHeightRef.current = h;
    }
  };

  const rating =
    typeof item.rating === 'number'
      ? item.rating
      : typeof item.voteAverage === 'number'
        ? item.voteAverage
        : null;

  // Animate slide-out to the left, then collapse height smoothly so bottom elements glide up
  const handleRemovePress = useCallback(() => {
    if (isRemoving) return;
    setIsRemoving(true);
    rowHeight.setValue(actualHeightRef.current);

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rowOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(rowHeight, {
        toValue: 0,
        duration: 240,
        delay: 60,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onRemove(item);
    });
  }, [isRemoving, item, onRemove, rowHeight, rowOpacity, translateX]);

  // PanResponder to handle smooth right-to-left slide gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture horizontal swipes to preserve vertical list scrolling
        return (
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
        );
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const base = isOpenRef.current ? -BUTTON_WIDTH : 0;
        let newX = base + gestureState.dx;
        // Restrict dragging to the right
        if (newX > 0) newX = 0;
        // Dampen dragging past the delete area
        if (newX < -BUTTON_WIDTH) {
          const excess = newX + BUTTON_WIDTH;
          newX = -BUTTON_WIDTH + excess * 0.35;
        }
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Fast or full swipe left triggers instant delete
        if (gestureState.dx < -160 || (gestureState.vx < -0.8 && gestureState.dx < -50)) {
          handleRemovePress();
          return;
        }

        const base = isOpenRef.current ? -BUTTON_WIDTH : 0;
        const currentX = base + gestureState.dx;

        // Snap open if swiped past threshold or flicked left
        if (currentX < -SWIPE_THRESHOLD || gestureState.vx < -0.35) {
          isOpenRef.current = true;
          Animated.spring(translateX, {
            toValue: -BUTTON_WIDTH,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        } else {
          // Snap back shut
          isOpenRef.current = false;
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  const handleCardPress = () => {
    // If delete area is open, tap anywhere to close it
    if (isOpenRef.current) {
      isOpenRef.current = false;
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
      return;
    }
    onPress(item);
  };

  return (
    <Animated.View
      style={[
        {
          overflow: 'hidden',
          backgroundColor: '#0a0b0e',
        },
        isRemoving ? { height: rowHeight } : undefined,
      ]}
      onLayout={onLayout}
      className="w-full relative"
    >
      {/* ── Revealed Delete Action on Slide (Behind card on the right) ── */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: BUTTON_WIDTH,
          backgroundColor: '#f2545b',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        <Pressable
          onPress={handleRemovePress}
          style={{
            flex: 1,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="Remove from watchlist"
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={24} color="#ffffff" />
          <Text style={{ color: '#ffffff', fontSize: 11.5, fontWeight: '700', marginTop: 4 }}>
            Delete
          </Text>
        </Pressable>
      </View>

      {/* ── Sliding Front Card (Covers the delete area until swiped) ── */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX }],
          opacity: rowOpacity,
          backgroundColor: '#0a0b0e',
          zIndex: 2,
        }}
      >
        <Pressable
          onPress={handleCardPress}
          className="w-full flex-row items-center px-4 py-3 bg-[#0a0b0e] active:bg-[#14161d]"
          accessibilityRole="button"
          accessibilityLabel={item.title}
        >
          {/* Poster Thumbnail */}
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
                <Ionicons name="film-outline" size={26} color="#5e6576" />
              </View>
            )}
          </View>

          {/* Content Info */}
          <View className="flex-1 justify-center max-h-[106px] overflow-hidden pr-2">
            <Text
              className="text-white text-[15px] font-bold leading-5 tracking-tight"
              numberOfLines={2}
            >
              {item.title}
            </Text>

            <View className="flex-row items-center gap-2 mt-1 mb-1">
              {rating !== null && rating > 0 && (
                <View className="flex-row items-center gap-1 bg-white/7 px-1.5 py-0.5 rounded-full">
                  <Ionicons name="star" size={10} color="#f5c518" />
                  <Text className="text-white text-[11px] font-bold">
                    {rating.toFixed(1)}
                  </Text>
                </View>
              )}
              <Text className="text-[11px] font-medium text-[#8a91a0] uppercase tracking-wider">
                {item.mediaType === 'tv' ? 'TV Show' : 'Movie'}
              </Text>
            </View>

            {item.overview ? (
              <Text
                className="text-[#8a91a0] text-[12px] leading-[17px]"
                numberOfLines={2}
              >
                {item.overview}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

export default function WatchlistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { watchlist, isWatchlistLoading, removeFromWatchlist } = useUserData();

  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCloseSearch = useCallback(() => {
    setIsSearchActive(false);
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  // Intercept back gesture/press when search is open
  useEffect(() => {
    if (!isSearchActive) return;

    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCloseSearch();
      return true;
    });

    const removeSub = (navigation as any).addListener('beforeRemove', (e: any) => {
      if (isSearchActive) {
        e.preventDefault();
        handleCloseSearch();
      }
    });

    return () => {
      backSub.remove();
      if (typeof removeSub === 'function') {
        removeSub();
      }
    };
  }, [isSearchActive, navigation, handleCloseSearch]);

  const filteredList = useMemo(() => {
    return (watchlist || []).filter((item) => {
      if (filterType !== 'all' && item.mediaType !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          (item.overview && item.overview.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [watchlist, filterType, searchQuery]);

  const handleMediaPress = (item: WatchlistItem) => {
    router.push({
      pathname: '/details/[id]',
      params: { id: String(item.mediaId), type: item.mediaType },
    });
  };

  const handleRemove = (item: WatchlistItem) => {
    removeFromWatchlist(item.mediaType, item.mediaId);
  };

  const bottomPad = insets.bottom + BottomTabInset + 20;

  return (
    <View className="flex-1 bg-[#0a0b0e]">
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#0a0b0e' },
          headerShadowVisible: false,
          headerTitleAlign: 'left',
          headerLeft: isSearchActive
            ? () => null
            : () => (
                <Pressable
                  onPress={() => router.back()}
                  hitSlop={12}
                  className="w-10 h-10 rounded-full bg-white/8 items-center justify-center active:opacity-75 -ml-1 mr-2"
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="chevron-back" size={24} color="#ffffff" />
                </Pressable>
              ),
          headerTitle: isSearchActive
            ? () => (
                <View style={{ width: Math.max(200, SCREEN_WIDTH - 32) }} className="-ml-1">
                  <HeaderSearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onClose={handleCloseSearch}
                    placeholder="Search watchlist..."
                  />
                </View>
              )
            : () => (
                <Text className="text-white text-[20px] font-extrabold tracking-tight">
                  Watchlist
                </Text>
              ),
          headerRight: isSearchActive
            ? () => null
            : () => (
                <Pressable
                  onPress={() => setIsSearchActive(true)}
                  hitSlop={10}
                  className="p-1 items-center justify-center active:opacity-70 -mr-1"
                  accessibilityRole="button"
                  accessibilityLabel="Search watchlist"
                >
                  <Ionicons name="search" size={22} color="#ffffff" />
                </Pressable>
              ),
        }}
      />
      <StatusBar barStyle="light-content" />

      <FlashList
        data={filteredList}
        keyExtractor={(item) => `wl-${item.mediaType}-${item.mediaId}-${item.id || ''}`}
        renderItem={({ item }) => (
          <WatchlistCard
            item={item}
            onPress={handleMediaPress}
            onRemove={handleRemove}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-[1px] bg-white/6 w-full" />}
        showsVerticalScrollIndicator={false}
        className="flex-1 w-full"
        contentContainerStyle={{
          paddingBottom: bottomPad,
          paddingTop: 8,
        }}
        ListHeaderComponent={
          watchlist.length > 0 ? (
            <View className="px-4 gap-3 mb-2">
              {/* FILTER PILLS */}
              <View className="flex-row gap-2">
                {(['all', 'movie', 'tv'] as const).map((type) => {
                  const active = filterType === type;
                  const label = type === 'all' ? 'All' : type === 'movie' ? 'Movies' : 'TV Shows';
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setFilterType(type)}
                      className="px-4 py-1.5 rounded-xl border border-white/8 bg-[#16181f]"
                      style={active && { backgroundColor: BrandColors.primary, borderColor: BrandColors.primary }}
                    >
                      <Text
                        className="text-[13px] font-semibold"
                        style={active ? { color: '#ffffff', fontWeight: '700' } : { color: '#9aa0ad' }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          isWatchlistLoading && watchlist.length === 0 ? (
            <View className="items-center justify-center py-[60px] gap-3">
              <ActivityIndicator size="large" color={BrandColors.primary} />
              <Text className="text-[#9aa0ad] text-[13px]">Loading watchlist...</Text>
            </View>
          ) : (
            <View className="px-4 pt-4">
              <EmptyState
                icon={searchQuery ? 'search-outline' : 'add-circle-outline'}
                title={
                  searchQuery || filterType !== 'all'
                    ? 'No matching titles'
                    : 'Your Watchlist is empty'
                }
                subtitle={
                  searchQuery
                    ? `No items in your watchlist match "${searchQuery}"`
                    : filterType !== 'all'
                      ? 'Try changing your filter'
                      : 'Explore movies and TV shows to save them to your personal watchlist.'
                }
                actionLabel={
                  searchQuery
                    ? 'Clear Search'
                    : watchlist.length === 0
                      ? 'Browse Categories'
                      : undefined
                }
                onAction={
                  searchQuery
                    ? () => setSearchQuery('')
                    : watchlist.length === 0
                      ? () => router.push('/categories')
                      : undefined
                }
              />
            </View>
          )
        }
      />
    </View>
  );
}
