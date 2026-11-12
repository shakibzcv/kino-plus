import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
} from 'react-native';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps } from 'expo-router/ui';
import { usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/theme';

interface TabItem {
  name: string;
  href: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  activeWidth: number;
}

const TAB_ITEMS: TabItem[] = [
  { name: 'index',      href: '/',           activeIcon: 'home',     inactiveIcon: 'home-outline',     label: 'Home',       activeWidth: 94 },
  { name: 'movies',     href: '/movies',     activeIcon: 'film',     inactiveIcon: 'film-outline',     label: 'Movies',     activeWidth: 102 },
  { name: 'tv-shows',   href: '/tv-shows',   activeIcon: 'tv',       inactiveIcon: 'tv-outline',       label: 'TV Shows',   activeWidth: 114 },
  { name: 'categories', href: '/categories', activeIcon: 'grid',     inactiveIcon: 'grid-outline',     label: 'Categories', activeWidth: 118 },
  { name: 'settings',   href: '/settings',   activeIcon: 'settings', inactiveIcon: 'settings-outline', label: 'Settings',   activeWidth: 104 },
];

const ACTIVE_BG_COLOR = BrandColors.coralDeep; // #e0434b

interface AnimatedPillButtonProps extends Partial<TabTriggerSlotProps> {
  tab: TabItem;
  isActive: boolean;
  onSelect: () => void;
}

const AnimatedPillButton = React.memo(function AnimatedPillButton({
  tab,
  isActive,
  onSelect,
  onPress,
  ...props
}: AnimatedPillButtonProps) {
  const anim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isActive ? 1 : 0,
      tension: 200,
      friction: 18,
      useNativeDriver: false,
    }).start();
  }, [isActive, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [42, tab.activeWidth],
  });

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0)', ACTIVE_BG_COLOR],
  });

  const paddingHorizontal = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 14],
  });

  const labelMaxWidth = anim.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0, tab.activeWidth - 44],
  });

  const labelOpacity = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  const labelTranslateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });

  const handlePress = useCallback(
    (e: any) => {
      onSelect();
      onPress?.(e);
    },
    [onSelect, onPress]
  );

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      className="items-center justify-center cursor-pointer active:opacity-80"
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      <Animated.View
        className="h-[42px] rounded-full flex-row items-center justify-center overflow-hidden"
        style={{
          width,
          backgroundColor,
          paddingHorizontal,
        }}
      >
        {/* Left side: Icon */}
        <Ionicons
          name={isActive ? tab.activeIcon : tab.inactiveIcon}
          size={19}
          color={isActive ? '#ffffff' : '#8a91a0'}
        />

        {/* Right side: Text Label */}
        <Animated.View
          className="overflow-hidden justify-center"
          style={{
            maxWidth: labelMaxWidth,
            marginLeft: isActive ? 6 : 0,
            opacity: labelOpacity,
            transform: [{ translateX: labelTranslateX }],
          }}
        >
          <Text
            numberOfLines={1}
            className="text-[13px] font-bold text-white tracking-tight"
          >
            {tab.label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});

export default function AppTabs() {
  const pathname = usePathname();

  // Optimistic tab: provides instant 0ms visual feedback before navigation commits
  const [optimisticTab, setOptimisticTab] = useState<string | null>(null);

  // Resolve active tab name from pathname
  const currentTabName = useMemo(() => {
    if (pathname === '/')                   return 'index';
    if (pathname.startsWith('/movies'))     return 'movies';
    if (pathname.startsWith('/tv-shows'))   return 'tv-shows';
    if (pathname.startsWith('/categories')) return 'categories';
    if (pathname.startsWith('/settings'))   return 'settings';
    return 'index';
  }, [pathname]);

  // Synchronize optimistic selection once route changes
  useEffect(() => {
    if (optimisticTab && optimisticTab === currentTabName) {
      setOptimisticTab(null);
    }
  }, [currentTabName, optimisticTab]);

  // Displayed active tab — optimistic during press, committed after navigation
  const activeTabName = optimisticTab ?? currentTabName;

  // Hide tab bar on full-screen player and nested settings screens
  const hideTabBar = pathname.startsWith('/watch') || pathname.startsWith('/devices');

  const handleTabPress = useCallback((tab: TabItem) => {
    if (activeTabName === tab.name) return;
    setOptimisticTab(tab.name);
  }, [activeTabName]);

  return (
    <Tabs>
      <TabSlot detachInactiveScreens={false} style={{ flex: 1 }} />

      {/* ── Modern Floating Animated Pill Bottom Bar ── */}
      {!hideTabBar && (
        <View
          className="absolute bottom-4 left-[18px] right-[18px] items-center z-[9999]"
          pointerEvents="box-none"
        >
          <View className="w-full max-w-[440px] h-[60px] rounded-full bg-[#101219]/95 flex-row items-center justify-between px-2 shadow-2xl">
            {TAB_ITEMS.map((tab) => {
              const isActive = activeTabName === tab.name;
              return (
                <TabTrigger
                  key={tab.name}
                  name={tab.name}
                  className="items-center justify-center"
                  asChild
                >
                  <AnimatedPillButton
                    tab={tab}
                    isActive={isActive}
                    onSelect={() => handleTabPress(tab)}
                  />
                </TabTrigger>
              );
            })}
          </View>
        </View>
      )}

      {/* Hidden TabList — registers hrefs for expo-router */}
      <TabList style={{ display: 'none' }}>
        {TAB_ITEMS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href as any} />
        ))}
      </TabList>
    </Tabs>
  );
}
