import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-[60px] px-6 gap-2.5">
      {icon && (
        <View className="w-20 h-20 rounded-full bg-white/4 border border-white/8 items-center justify-center mb-1.5">
          <Ionicons name={icon} size={48} color={BrandColors.textMuted} />
        </View>
      )}
      <Text className="text-[18px] font-bold text-white">{title}</Text>
      <Text className="text-[13px] text-center text-[#8a91a0] leading-[19px] max-w-[280px]">{subtitle}</Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="flex-row items-center bg-[#f2545b] px-5 py-3 rounded-xl mt-3 shadow-lg active:opacity-75"
          style={{
            shadowColor: BrandColors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <Ionicons name="compass-outline" size={18} color="#fff" className="mr-1.5" />
          <Text className="text-[14px] font-bold text-white">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
