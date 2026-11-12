import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
} from "expo-router/ui";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabItem {
  name: string;
  href: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const TAB_ITEMS: TabItem[] = [
  {
    name: "index",
    href: "/",
    activeIcon: "home",
    inactiveIcon: "home-outline",
    label: "Home",
  },
  {
    name: "movies",
    href: "/movies",
    activeIcon: "film",
    inactiveIcon: "film-outline",
    label: "Movies",
  },
  {
    name: "tv-shows",
    href: "/tv-shows",
    activeIcon: "tv",
    inactiveIcon: "tv-outline",
    label: "TV Shows",
  },
  {
    name: "categories",
    href: "/categories",
    activeIcon: "grid",
    inactiveIcon: "grid-outline",
    label: "Categories",
  },
  {
    name: "settings",
    href: "/settings",
    activeIcon: "settings",
    inactiveIcon: "settings-outline",
    label: "Settings",
  },
];

interface TabButtonProps {
  tab: TabItem;
  isFocused: boolean;
  onSelect: () => void;
  onPress?: (e: any) => void;
}

const TabButton = React.memo(function TabButton({
  tab,
  isFocused,
  onSelect,
  onPress,
  ...restProps
}: TabButtonProps) {
  const handlePress = useCallback(
    (e: any) => {
      onSelect();
      onPress?.(e);
    },
    [onSelect, onPress]
  );

  return (
    <Pressable
      {...restProps}
      onPress={handlePress}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 3,
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={tab.label}
    >
      <Ionicons
        name={isFocused ? tab.activeIcon : tab.inactiveIcon}
        size={23}
        color={isFocused ? "#f2545b" : "#7f879a"}
      />
      <Text
        numberOfLines={1}
        style={{
          fontSize: 10.5,
          fontWeight: isFocused ? "700" : "500",
          color: isFocused ? "#f2545b" : "#7f879a",
          marginTop: 3,
          textAlign: "center",
        }}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
});

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  // Compute active tab directly from current route
  const currentTabName = useMemo(() => {
    if (pathname === "/") return "index";
    if (pathname.startsWith("/movies")) return "movies";
    if (pathname.startsWith("/tv-shows")) return "tv-shows";
    if (pathname.startsWith("/categories")) return "categories";
    if (pathname.startsWith("/settings")) return "settings";
    return "index";
  }, [pathname]);

  // Hide tab bar on full-screen player and nested screens
  const hideTabBar =
    pathname.startsWith("/watch") || pathname.startsWith("/devices");

  return (
    <Tabs>
      {/* Retain screens in memory so tab switching is instantaneous */}
      <TabSlot detachInactiveScreens={false} style={{ flex: 1 }} />

      {/* ── Standard Normal Bottom Tab Bar with Direct Synchronous TabTriggers ── */}
      {!hideTabBar && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 999,
            backgroundColor: "#0d0f14",
            borderTopWidth: 1,
            borderTopColor: "rgba(255, 255, 255, 0.08)",
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 6),
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
          }}
        >
          {TAB_ITEMS.map((tab) => {
            const isFocused = currentTabName === tab.name;
            return (
              <TabTrigger
                key={tab.name}
                name={tab.name}
                asChild
              >
                <TabButton
                  tab={tab}
                  isFocused={isFocused}
                  onSelect={() => {}}
                />
              </TabTrigger>
            );
          })}
        </View>
      )}

      {/* Hidden TabList — registers hrefs for expo-router */}
      <TabList style={{ display: "none" }}>
        {TAB_ITEMS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href as any} />
        ))}
      </TabList>
    </Tabs>
  );
}
