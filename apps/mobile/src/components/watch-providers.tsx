import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  getWatchProviders,
  WatchProvidersResponse,
  WatchProviderItem,
} from '@/services/movies';

interface WatchProvidersProps {
  mediaId: string | number;
  mediaType: 'movie' | 'tv';
}

export function WatchProviders({
  mediaId,
  mediaType,
}: WatchProvidersProps) {
  const [data, setData] = useState<WatchProvidersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getWatchProviders(mediaId, mediaType)
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mediaId, mediaType]);

  const handleOpenLink = async (url?: string) => {
    const target = url || data?.link;
    if (target) {
      try {
        await Linking.openURL(target);
      } catch (err) {
        console.warn('Cannot open url:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <View className="px-4 py-3 flex-row items-center gap-2">
        <ActivityIndicator size="small" color="#f2545b" />
        <Text className="text-[#8c93a4] text-xs">Checking availability...</Text>
      </View>
    );
  }

  const streaming = data?.streaming || [];
  const stores = data?.stores || [];
  const hasAny = streaming.length > 0 || stores.length > 0;

  if (!hasAny) {
    return null;
  }

  const renderBadge = (item: WatchProviderItem) => (
    <Pressable
      key={`${item.id}-${item.category}`}
      onPress={() => handleOpenLink()}
      className="items-center bg-[#14161c] p-2.5 rounded-xl border border-white/5 active:opacity-75 mr-2.5"
      style={{ width: 88 }}
    >
      <View className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 mb-1.5 border border-white/10">
        {item.logo ? (
          <ExpoImage
            source={{ uri: item.logo }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-white text-[10px] font-bold">
              {item.name.slice(0, 2)}
            </Text>
          </View>
        )}
      </View>
      <Text
        className="text-white text-[11px] font-bold text-center"
        numberOfLines={1}
      >
        {item.name}
      </Text>
      <Text
        className="text-[#8c93a4] text-[9px] text-center mt-0.5"
        numberOfLines={1}
      >
        {item.regionLabel}
      </Text>
    </Pressable>
  );

  return (
    <View className="px-4 mb-5">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white text-[14px] font-bold tracking-tight">
          Where to Watch
        </Text>

      </View>

      {/* Stream Row */}
      {streaming.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 2 }}
        >
          {streaming.map(renderBadge)}
        </ScrollView>
      )}

      {/* Stores Row (if no streaming or few streams) */}
      {streaming.length === 0 && stores.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 2 }}
        >
          {stores.slice(0, 8).map(renderBadge)}
        </ScrollView>
      )}
    </View>
  );
}
