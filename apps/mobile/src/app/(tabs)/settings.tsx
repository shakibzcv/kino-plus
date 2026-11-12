import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useUserData } from '@/context/user-data-context';
import { BottomTabInset, BrandColors, MaxContentWidth } from '@/constants/theme';
import { GoogleIcon } from '@/components/google-signin-button';
import { getLocalCacheSize, clearLocalCache } from '@/utils/cache-manager';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  isLast?: boolean;
}

const SettingsRow = React.memo(function SettingsRow({
  icon,
  iconColor,
  iconBg,
  label,
  subtitle,
  value,
  onPress,
  danger,
  isLast,
}: SettingsRowProps) {
  const defaultIconColor = danger ? BrandColors.primary : '#a0a6b5';
  const defaultIconBg = danger ? 'rgba(242, 84, 91, 0.12)' : 'rgba(255, 255, 255, 0.06)';

  return (
    <View className="w-full">
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        className="w-full active:bg-white/4"
      >
        <View className="flex-row items-center justify-between px-3.5 py-3 min-h-[56px] w-full">
          {/* Left: Fixed Icon Container */}
          <View
            className="mr-3.5 h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: iconBg || defaultIconBg }}
          >
            <Ionicons
              name={icon}
              size={18}
              color={iconColor || defaultIconColor}
            />
          </View>

          {/* Center: Label & Optional Subtitle */}
          <View className="mr-2.5 flex-1 justify-center min-w-0">
            <Text
              className="text-[14.5px] font-semibold text-white tracking-tight"
              style={danger && { color: '#f2545b', fontWeight: '700' }}
              numberOfLines={1}
            >
              {label}
            </Text>
            {subtitle ? (
              <Text className="mt-0.5 text-[11.5px] text-[#7a8194]" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          {/* Right: Value Pill & Chevron */}
          <View className="flex-row items-center gap-2 shrink-0">
            {value ? (
              <View className="rounded-lg bg-white/6 px-2 py-0.5">
                <Text className="text-[12px] font-medium text-[#8d95a6]" numberOfLines={1}>
                  {value}
                </Text>
              </View>
            ) : null}
            {onPress && (
              <Ionicons
                name="chevron-forward"
                size={16}
                color="#5e6576"
                className="ml-0.5"
              />
            )}
          </View>
        </View>
      </Pressable>

      {/* Indented Divider (skips icon column for clean list alignment) */}
      {!isLast && <View className="h-[0.5px] bg-white/6 ml-[65px]" />}
    </View>
  );
});

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, signInWithGoogle, isGoogleSigningIn, isGuest } = useAuth();
  const { watchlist } = useUserData();
  const [cacheSize, setCacheSize] = useState<string>('...');

  useEffect(() => {
    let isMounted = true;
    getLocalCacheSize().then((info) => {
      if (isMounted) setCacheSize(info.formatted);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your Kino+ account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Local Cache',
      `This will free up ${cacheSize} of cached poster thumbnails, temporary media, and in-memory API data. Your watchlist will remain untouched.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await clearLocalCache();
              const updated = await getLocalCacheSize();
              setCacheSize(updated.formatted);
              Alert.alert('Cache Cleared', `Successfully cleared local cache (${res.formattedFreed} freed).`);
            } catch {
              Alert.alert('Error', 'Failed to clear local cache.');
            }
          },
        },
      ]
    );
  };

  const handleDevices = () => {
    router.push('/devices');
  };

  return (
    <View className="flex-1 bg-[#0e1013]">
      <StatusBar barStyle="light-content" backgroundColor="#0e1013" />
      <SafeAreaView className="flex-1">
        {/* ========================================================
            📌 STICKY TOP HEADER (ALWAYS AT THE TOP WHEN SCROLLING)
            ======================================================== */}
        <View
          className="px-4 pb-3 bg-[#0e1013]"
          style={{
            zIndex: 100,
            elevation: 8,
          }}
        >
          <View className="mx-auto w-full self-center" style={{ maxWidth: MaxContentWidth }}>
            <Text className="text-[26px] font-extrabold text-white tracking-tighter">Settings</Text>
            <Text className="mt-0.5 text-[13px] font-medium text-[#7e8597]">Account &amp; App Preferences</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="pt-3"
          contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mx-auto w-full self-center" style={{ maxWidth: MaxContentWidth }}>
            {/* ── 1. Profile / Account Card ──────────────────────────────── */}
            <View className="mx-4 mb-2 flex-row items-center gap-3.5 rounded-[18px] bg-[#16181d] p-3">
              {user?.photo ? (
                <Image source={{ uri: user.photo }} style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: '#20232b', borderWidth: 1.5, borderColor: '#f2545b' }} />
              ) : (
                <View className="h-[58px] w-[58px] items-center justify-center rounded-full bg-[#20232b]">
                  {user ? (
                    <Text className="text-[22px] font-extrabold text-white">
                      {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
                    </Text>
                  ) : (
                    <Ionicons name="person" size={26} color="#ffffff" />
                  )}
                </View>
              )}

              <View className="flex-1 justify-center">
                <Text className="text-[17px] font-bold text-white tracking-tight" numberOfLines={1}>
                  {user?.name ?? 'Guest User'}
                </Text>
                <Text className="mt-0.5 text-[12.5px] text-[#8c93a4]" numberOfLines={1}>
                  {user?.email ?? 'Sign in to sync your library across devices'}
                </Text>

                {!user && (
                  <Pressable
                    onPress={signInWithGoogle}
                    disabled={isGoogleSigningIn}
                    className="mt-2 flex-row items-center gap-1.5 self-start rounded-2xl bg-[#f2545b] px-3 py-1.5 active:bg-[#e0434b] active:scale-[0.98]"
                    style={{ 
                      shadowColor: '#f2545b',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    {isGoogleSigningIn ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <GoogleIcon size={14} />
                        <Text className="text-[12px] font-bold text-white">Sign In with Google</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            </View>

            {/* ── 2. Account ─────────────────────────────────────────────── */}
            {user && (
              <>
                <Text className="mx-4 mt-4 mb-1.5 px-0.5 text-[11px] font-extrabold tracking-widest uppercase text-[#737b8d]">Account</Text>
                <View className="mx-4 overflow-hidden rounded-2xl bg-[#16181d]">
                  <SettingsRow
                    icon="person"
                    iconColor="#f2545b"
                    iconBg="rgba(242, 84, 91, 0.14)"
                    label="My Account"
                    subtitle="View profile details"
                    onPress={() => router.push('/account')}
                    isLast
                  />
                </View>
              </>
            )}

            {/* ── 3. Library & Content ──────────────────────────────────── */}
            <Text className="mx-4 mt-4 mb-1.5 px-0.5 text-[11px] font-extrabold tracking-widest uppercase text-[#737b8d]">Library &amp; Content</Text>
            <View className="mx-4 overflow-hidden rounded-2xl bg-[#16181d]">
              <SettingsRow
                icon="add-circle"
                iconColor="#f2545b"
                iconBg="rgba(242, 84, 91, 0.14)"
                label="My Watchlist"
                subtitle="Saved movies &amp; series"
                value={`${watchlist.length} ${watchlist.length === 1 ? 'item' : 'items'}`}
                onPress={() => router.push('/watchlist')}
              />
              <SettingsRow
                icon="grid"
                iconColor="#a855f7"
                iconBg="rgba(168, 85, 247, 0.14)"
                label="Explore Categories"
                subtitle="14 curated genres"
                value="Browse"
                onPress={() => router.push('/categories')}
                isLast
              />
            </View>

            {/* ── 3. Devices & Storage ──────────────────────────────────── */}
            <Text className="mx-4 mt-4 mb-1.5 px-0.5 text-[11px] font-extrabold tracking-widest uppercase text-[#737b8d]">Devices &amp; Storage</Text>
            <View className="mx-4 overflow-hidden rounded-2xl bg-[#16181d]">
              <SettingsRow
                icon="tv-outline"
                iconColor="#818cf8"
                iconBg="rgba(129, 140, 248, 0.14)"
                label="Devices"
                subtitle="Manage linked devices"
                onPress={handleDevices}
              />
              <SettingsRow
                icon="trash-outline"
                iconColor="#94a3b8"
                iconBg="rgba(148, 163, 184, 0.12)"
                label="Clear Local Cache"
                subtitle="Temporary posters &amp; thumbnails"
                value={cacheSize}
                onPress={handleClearCache}
                isLast
              />
            </View>

            {/* ── 5. Support & About ────────────────────────────────────── */}
            <Text className="mx-4 mt-4 mb-1.5 px-0.5 text-[11px] font-extrabold tracking-widest uppercase text-[#737b8d]">Support &amp; About</Text>
            <View className="mx-4 overflow-hidden rounded-2xl bg-[#16181d]">
              <SettingsRow
                icon="help-circle-outline"
                iconColor="#38bdf8"
                iconBg="rgba(56, 189, 248, 0.12)"
                label="Help &amp; FAQ"
                subtitle="Common streaming questions"
                onPress={() =>
                  Alert.alert('Help & FAQ', 'Kino+ is 100% free with no monthly subscription. Need support? Reach us at support@kino-plus.com.')
                }
              />
              <SettingsRow
                icon="shield-checkmark-outline"
                iconColor="#10b981"
                iconBg="rgba(16, 185, 129, 0.12)"
                label="Privacy Policy"
                subtitle="How your information is protected"
                onPress={() =>
                  Alert.alert('Privacy Policy', 'Your privacy is essential to us. We never sell your personal data or streaming activity.')
                }
              />
              <SettingsRow
                icon="document-text-outline"
                iconColor="#a1a1aa"
                iconBg="rgba(161, 161, 170, 0.12)"
                label="Terms of Service"
                subtitle="Standard usage guidelines"
                onPress={() =>
                  Alert.alert('Terms of Service', 'Kino+ provides public streaming feeds and TMDB catalog access under standard terms of service.')
                }
                isLast
              />
            </View>

            {/* ── 6. Account Actions ────────────────────────────────────── */}
            {user ? (
              <View className="mx-4 mt-4 overflow-hidden rounded-2xl bg-[#16181d]">
                <SettingsRow
                  icon="log-out-outline"
                  iconColor="#f2545b"
                  iconBg="rgba(242, 84, 91, 0.15)"
                  label="Sign Out"
                  subtitle="Sign out from this device"
                  onPress={handleSignOut}
                  danger
                  isLast
                />
              </View>
            ) : isGuest ? (
              <View className="mx-4 mt-4 overflow-hidden rounded-2xl bg-[#16181d]">
                <SettingsRow
                  icon="logo-google"
                  iconColor="#4285F4"
                  iconBg="rgba(66, 133, 244, 0.12)"
                  label={isGoogleSigningIn ? 'Connecting...' : 'Sign In with Google'}
                  subtitle="Unlock watchlists, history & sync"
                  onPress={() => signInWithGoogle()}
                  isLast
                />
              </View>
            ) : null}

            {/* App Version */}
            <View className="mx-4 mt-5 mb-2 items-center justify-center px-4">
              <Text className="text-[11.5px] font-medium text-[#5a6070]">v1.0.0 (Build 2026.1)</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
