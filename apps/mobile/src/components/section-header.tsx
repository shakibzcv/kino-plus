import React from 'react';
import { View, Text, Pressable } from 'react-native';

export const SectionHeader = React.memo(function SectionHeader({
  title,
  subtitle,
  count,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  onSeeAll?: () => void;
}) {
  return (
    <View className="flex-row items-start justify-between">
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[17px] font-extrabold text-white tracking-tight">{title}</Text>
          {count !== undefined && count > 0 && (
            <View className="rounded-full bg-white/8 px-1.5 py-0.5">
              <Text className="text-[11px] font-bold text-[#9aa0ad]">{count}</Text>
            </View>
          )}
        </View>
        {subtitle ? <Text className="mt-0.5 text-[12px] text-[#8a91a0]">{subtitle}</Text> : null}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text className="mt-0.5 text-[13px] font-semibold text-[#f2545b]">See all</Text>
        </Pressable>
      )}
    </View>
  );
});
