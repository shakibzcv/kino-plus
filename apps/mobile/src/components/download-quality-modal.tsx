import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { DownloadQuality } from '@/types/downloads';
import { useDownloads } from '@/context/download-context';

interface DownloadQualityModalProps {
  visible: boolean;
  title: string;
  poster?: string | null;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  episodeTitle?: string | null;
  duration?: number;
  onClose: () => void;
  onConfirm: (quality: DownloadQuality) => void;
}

interface QualityOption {
  quality: DownloadQuality;
  label: string;
  badge: string;
  sizeMovie: string;
  sizeEpisode: string;
  description: string;
}

const QUALITY_OPTIONS: QualityOption[] = [
  {
    quality: '1080p',
    label: 'High (1080p)',
    badge: 'Full HD',
    sizeMovie: '~1.4 GB',
    sizeEpisode: '~450 MB',
    description: 'Crisp picture, best for tablets & large screens',
  },
  {
    quality: '720p',
    label: 'Standard (720p)',
    badge: 'Recommended',
    sizeMovie: '~650 MB',
    sizeEpisode: '~220 MB',
    description: 'Great quality, fast download & balanced space',
  },
  {
    quality: '480p',
    label: 'Data Saver (480p)',
    badge: 'Fastest',
    sizeMovie: '~320 MB',
    sizeEpisode: '~120 MB',
    description: 'Smallest file size, saves mobile storage',
  },
];

export function DownloadQualityModal({
  visible,
  title,
  poster,
  mediaType,
  season,
  episode,
  episodeTitle,
  onClose,
  onConfirm,
}: DownloadQualityModalProps) {
  const { storageInfo } = useDownloads();
  const [selectedQuality, setSelectedQuality] = useState<DownloadQuality>('720p');

  const freeGb = (storageInfo.freeDiskBytes / (1024 * 1024 * 1024)).toFixed(1);

  const handleStart = () => {
    onConfirm(selectedQuality);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/75 justify-end">
          <TouchableWithoutFeedback onPress={() => {}}>
            <View className="bg-[#14161c] rounded-t-3xl px-5 pt-5 pb-8 max-w-lg mx-auto w-full">
              {/* Drag Handle */}
              <View className="w-10 h-1 bg-white/20 rounded-full self-center mb-4" />

              {/* Title Header */}
              <View className="flex-row items-center gap-3.5 mb-5 pb-3">
                {poster ? (
                  <View className="w-12 h-16 rounded-lg overflow-hidden bg-[#20232b] shrink-0">
                    <ExpoImage
                      source={{ uri: poster }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  </View>
                ) : (
                  <View className="w-12 h-16 rounded-lg bg-[#20232b] items-center justify-center shrink-0">
                    <Ionicons name="film-outline" size={20} color="#71717a" />
                  </View>
                )}

                <View className="flex-1">
                  <Text className="text-white text-[16px] font-black tracking-tight" numberOfLines={1}>
                    {title}
                  </Text>
                  {mediaType === 'tv' && (
                    <Text className="text-[#f2545b] text-[12px] font-bold mt-0.5" numberOfLines={1}>
                      Season {season || 1} • Episode {episode || 1}{' '}
                      {episodeTitle ? `• ${episodeTitle}` : ''}
                    </Text>
                  )}
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <Ionicons name="hardware-chip-outline" size={13} color="#8c93a4" />
                    <Text className="text-[#8c93a4] text-[11px] font-medium">
                      {freeGb} GB free storage available
                    </Text>
                  </View>
                </View>

                <Pressable onPress={onClose} hitSlop={10} className="p-1 -mr-1">
                  <Ionicons name="close" size={22} color="#8c93a4" />
                </Pressable>
              </View>

              {/* Quality Selection Options */}
              <Text className="text-white text-[13px] font-extrabold tracking-wider uppercase text-zinc-400 mb-2.5">
                Select Download Quality
              </Text>

              <View className="gap-2.5 mb-6">
                {QUALITY_OPTIONS.map((opt) => {
                  const isSelected = selectedQuality === opt.quality;
                  const estimatedSize = mediaType === 'tv' ? opt.sizeEpisode : opt.sizeMovie;

                  return (
                    <Pressable
                      key={opt.quality}
                      onPress={() => setSelectedQuality(opt.quality)}
                      className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${
                        isSelected
                          ? 'bg-[#f2545b]/12 border-[#f2545b]'
                          : 'bg-[#1b1e26] border-white/8 active:bg-white/5'
                      }`}
                    >
                      <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-2 mb-0.5">
                          <Text
                            className={`text-[14px] font-extrabold ${
                              isSelected ? 'text-white' : 'text-zinc-200'
                            }`}
                          >
                            {opt.label}
                          </Text>
                          <View
                            className={`px-2 py-0.5 rounded-md ${
                              opt.badge === 'Recommended'
                                ? 'bg-[#f2545b] text-white'
                                : 'bg-white/10'
                            }`}
                          >
                            <Text
                              className={`text-[9.5px] font-black uppercase ${
                                opt.badge === 'Recommended' ? 'text-white' : 'text-zinc-300'
                              }`}
                            >
                              {opt.badge}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-[#8c93a4] text-[11px] leading-3.5">
                          {opt.description}
                        </Text>
                      </View>

                      <View className="items-end gap-1">
                        <Text
                          className={`text-[13px] font-black ${
                            isSelected ? 'text-[#f2545b]' : 'text-white'
                          }`}
                        >
                          {estimatedSize}
                        </Text>
                        <View
                          className={`w-5 h-5 rounded-full border items-center justify-center ${
                            isSelected
                              ? 'border-[#f2545b] bg-[#f2545b]'
                              : 'border-white/30 bg-transparent'
                          }`}
                        >
                          {isSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={onClose}
                  className="flex-1 h-12 rounded-xl bg-white/10 items-center justify-center active:opacity-75"
                >
                  <Text className="text-white text-[14px] font-bold">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleStart}
                  className="flex-2 h-12 rounded-xl bg-[#f2545b] flex-row items-center justify-center gap-2 active:opacity-85 shadow-lg"
                >
                  <Ionicons name="download" size={18} color="#fff" />
                  <Text className="text-white text-[14px] font-black tracking-wide">
                    Start Download
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
