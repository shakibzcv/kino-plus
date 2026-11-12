import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDownloads } from '@/context/download-context';
import { DownloadQuality, StartDownloadParams } from '@/types/downloads';
import { DownloadQualityModal } from './download-quality-modal';

interface DownloadButtonProps {
  mediaId: string;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  overview?: string | null;
  releaseYear?: string;
  duration?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string | null;
  variant?: 'pill' | 'icon' | 'action-bar';
  onPlayOffline?: () => void;
}

export function DownloadButton({
  mediaId,
  mediaType,
  title,
  posterPath,
  backdropPath,
  overview,
  releaseYear,
  duration,
  seasonNumber,
  episodeNumber,
  episodeTitle,
  variant = 'pill',
  onPlayOffline,
}: DownloadButtonProps) {
  const router = useRouter();
  const {
    findItem,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deleteDownload,
  } = useDownloads();

  const [showQualityModal, setShowQualityModal] = useState(false);

  const downloadItem = findItem(mediaId, seasonNumber, episodeNumber);
  const status = downloadItem?.status || 'idle';
  const progress = downloadItem?.progress || 0;

  const handlePress = () => {
    // Download functionality removed — illegal download link eliminated.
    // Wire up a licensed download service here if needed.
    Alert.alert('Downloads Unavailable', 'Download functionality is not available.');
  };

  const handleConfirmQuality = (quality: DownloadQuality) => {
    const params: StartDownloadParams = {
      mediaId,
      mediaType,
      title,
      posterPath,
      backdropPath,
      overview,
      releaseYear,
      duration,
      seasonNumber,
      episodeNumber,
      episodeTitle,
      preferredQuality: quality,
    };
    startDownload(params);
  };

  // 1. Action-Bar Variant (matches Details quick action bar)
  if (variant === 'action-bar') {
    let iconName: keyof typeof Ionicons.glyphMap = 'arrow-down';
    let iconBg = 'bg-white/8';
    let label = 'Download';
    let labelColor = 'text-[#8c93a4]';

    if (status === 'completed') {
      iconName = 'checkmark-circle';
      iconBg = 'bg-emerald-600';
      label = 'Downloaded';
      labelColor = 'text-emerald-400';
    } else if (status === 'downloading') {
      iconBg = 'bg-[#f2545b]';
      label = `${progress}%`;
      labelColor = 'text-[#f2545b]';
    } else if (status === 'queued' || status === 'fetching_sources') {
      iconBg = 'bg-amber-600';
      label = 'Queued';
      labelColor = 'text-amber-400';
    } else if (status === 'paused') {
      iconName = 'pause-circle';
      iconBg = 'bg-amber-600/30';
      label = 'Paused';
      labelColor = 'text-amber-300';
    } else if (status === 'failed') {
      iconName = 'alert-circle';
      iconBg = 'bg-red-600/30';
      label = 'Retry';
      labelColor = 'text-red-400';
    }

    return (
      <>
        <Pressable onPress={handlePress} className="items-center gap-1 active:opacity-75">
          <View className={`w-9.5 h-9.5 rounded-full items-center justify-center ${iconBg}`}>
            {status === 'downloading' || status === 'fetching_sources' ? (
              <ActivityIndicator size={16} color="#fff" />
            ) : (
              <Ionicons name={iconName} size={18} color="#fff" />
            )}
          </View>
          <Text className={`text-[10.5px] font-semibold ${labelColor}`}>{label}</Text>
        </Pressable>

        <DownloadQualityModal
          visible={showQualityModal}
          title={title}
          poster={posterPath}
          mediaType={mediaType}
          season={seasonNumber}
          episode={episodeNumber}
          episodeTitle={episodeTitle}
          duration={duration}
          onClose={() => setShowQualityModal(false)}
          onConfirm={handleConfirmQuality}
        />
      </>
    );
  }

  // 2. Icon-only variant (for episode list rows)
  if (variant === 'icon') {
    return (
      <>
        <Pressable
          onPress={handlePress}
          hitSlop={12}
          className={`w-9.5 h-9.5 rounded-full items-center justify-center active:opacity-75 ${
            status === 'completed'
              ? 'bg-emerald-500/15'
              : status === 'downloading'
              ? 'bg-[#f2545b]/15'
              : status === 'queued' || status === 'fetching_sources'
              ? 'bg-amber-500/15'
              : status === 'paused'
              ? 'bg-amber-500/15'
              : status === 'failed'
              ? 'bg-red-500/15'
              : 'bg-white/10 active:bg-white/20'
          }`}
          accessibilityLabel={`Download episode ${episodeNumber || ''}`}
        >
          {status === 'completed' ? (
            <Ionicons name="checkmark-circle" size={22} color="#10b981" />
          ) : status === 'downloading' ? (
            <ActivityIndicator size={16} color="#f2545b" />
          ) : status === 'queued' || status === 'fetching_sources' ? (
            <Ionicons name="time-outline" size={18} color="#f59e0b" />
          ) : status === 'paused' ? (
            <Ionicons name="play" size={15} color="#fbbf24" style={{ marginLeft: 1 }} />
          ) : status === 'failed' ? (
            <Ionicons name="alert-circle" size={19} color="#ef4444" />
          ) : (
            <Ionicons name="arrow-down" size={17} color="#ffffff" />
          )}
        </Pressable>

        <DownloadQualityModal
          visible={showQualityModal}
          title={title}
          poster={posterPath}
          mediaType={mediaType}
          season={seasonNumber}
          episode={episodeNumber}
          episodeTitle={episodeTitle}
          duration={duration}
          onClose={() => setShowQualityModal(false)}
          onConfirm={handleConfirmQuality}
        />
      </>
    );
  }

  // 3. Pill variant (default for Watch Screen action bar)
  let pillBg = 'bg-white/10';
  let pillText = 'Download';
  let pillIcon: keyof typeof Ionicons.glyphMap = 'arrow-down-outline';

  if (status === 'completed') {
    pillBg = 'bg-emerald-600/30';
    pillText = 'Downloaded';
    pillIcon = 'checkmark-circle';
  } else if (status === 'downloading') {
    pillBg = 'bg-[#f2545b]/20';
    pillText = `${progress}%`;
  } else if (status === 'queued') {
    pillBg = 'bg-amber-600/20';
    pillText = 'Queued';
    pillIcon = 'time-outline';
  } else if (status === 'paused') {
    pillBg = 'bg-white/10';
    pillText = 'Resume';
    pillIcon = 'play-outline';
  }

  return (
    <>
      <Pressable
        onPress={handlePress}
        className={`flex-row items-center gap-2 px-4 py-2 rounded-full active:opacity-75 ${pillBg}`}
      >
        {status === 'downloading' ? (
          <ActivityIndicator size={14} color="#f2545b" />
        ) : (
          <Ionicons
            name={pillIcon}
            size={17}
            color={status === 'completed' ? '#10b981' : '#ffffff'}
          />
        )}
        <Text
          className={`text-[12px] font-bold ${
            status === 'completed'
              ? 'text-emerald-400'
              : status === 'downloading'
              ? 'text-[#f2545b]'
              : 'text-white'
          }`}
        >
          {pillText}
        </Text>
      </Pressable>

      <DownloadQualityModal
        visible={showQualityModal}
        title={title}
        poster={posterPath}
        mediaType={mediaType}
        season={seasonNumber}
        episode={episodeNumber}
        episodeTitle={episodeTitle}
        duration={duration}
        onClose={() => setShowQualityModal(false)}
        onConfirm={handleConfirmQuality}
      />
    </>
  );
}
