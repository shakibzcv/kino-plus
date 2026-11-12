import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuth } from '@/context/auth-context';
import { BrandColors } from '@/constants/theme';
import {
  DeviceSession,
  fetchDeviceSessionsPage,
  formatSessionMeta,
  presentDevice,
  revokeDeviceSession,
  revokeOtherDeviceSessions,
  SESSIONS_PAGE_SIZE,
} from '@/services/sessions';

function SessionRow({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  meta,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  meta: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      className="flex-row items-center px-3.5 py-3 active:opacity-70"
    >
      <View
        className="mr-3 h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-[16px] font-bold leading-5 text-white"
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="mt-0.5 text-[13px] leading-4 text-[#8b93a5]"
        >
          {subtitle}
        </Text>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="mt-0.5 text-[12px] leading-4 text-[#6f7788]"
        >
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}

export default function DevicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [currentSession, setCurrentSession] = useState<DeviceSession | null>(null);
  const [otherSessions, setOtherSessions] = useState<DeviceSession[]>([]);
  const [otherTotal, setOtherTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);
  const pageRef = useRef(1);

  const loadSessions = useCallback(async (nextPage = 1, append = false) => {
    if (append) {
      if (loadingMoreRef.current || !hasMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }

    const result = await fetchDeviceSessionsPage(nextPage, SESSIONS_PAGE_SIZE);
    setCurrentSession(result.current);
    setOtherSessions((prev) => {
      if (!append) return result.sessions;
      const seen = new Set(prev.map((session) => session.id));
      return [...prev, ...result.sessions.filter((session) => !seen.has(session.id))];
    });
    setOtherTotal(result.total);
    pageRef.current = result.page;
    hasMoreRef.current = result.hasMore;

    if (append) {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await loadSessions(1, false);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [loadSessions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions(1, false);
    setRefreshing(false);
  }, [loadSessions]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 120;
      if (nearBottom) {
        loadSessions(pageRef.current + 1, true);
      }
    },
    [loadSessions]
  );

  const thisDeviceFallback = useMemo(() => {
    const model = Device.modelName || Device.deviceName || Device.osName || 'This phone';
    const os = [Device.osName, Device.osVersion].filter(Boolean).join(' ');
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    return {
      title: Device.deviceName || model,
      subtitle: `Kino+ ${os || Platform.OS} ${appVersion}`.replace(/\s+/g, ' ').trim(),
    };
  }, []);

  const currentPresentation = presentDevice(currentSession?.userAgent);

  const handleTerminateOthers = () => {
    if (otherTotal === 0) {
      Alert.alert('No other sessions', 'This is the only device signed in right now.');
      return;
    }

    Alert.alert(
      'Terminate all other sessions?',
      'This signs out every other phone, TV, and browser except this one.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const result = await revokeOtherDeviceSessions();
            setBusy(false);
            if (!result.ok) {
              Alert.alert('Could not terminate sessions', result.message);
              return;
            }
            await loadSessions(1, false);
          },
        },
      ]
    );
  };

  const handleTerminateSession = (session: DeviceSession) => {
    const info = presentDevice(session.userAgent);
    Alert.alert(
      `Terminate ${info.title}?`,
      'This device will be signed out of your Kino+ account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const result = await revokeDeviceSession(session.id);
            setBusy(false);
            if (!result.ok) {
              Alert.alert('Could not terminate session', result.message);
              return;
            }
            await loadSessions(1, false);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-[#0e1013]">
      <StatusBar barStyle="light-content" />

      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Devices',
          headerStyle: { backgroundColor: '#0e1013' },
          headerShadowVisible: false,
          headerTitleAlign: 'left',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              className="h-11 w-11 items-center justify-center active:opacity-70 -ml-2 mr-1"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={26} color="#ffffff" />
            </Pressable>
          ),
          headerTitle: () => (
            <Text numberOfLines={1} className="text-[20px] font-bold text-white">
              Devices
            </Text>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 32,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BrandColors.primary}
            colors={[BrandColors.primary]}
          />
        }
      >
        <View className="w-full max-w-[800px] self-center">
          <Text numberOfLines={1} className="mb-2 ml-6 mt-3 px-1 text-[13px] font-semibold text-[#6f7788]">
            This device
          </Text>
          <View className="mx-6 overflow-hidden rounded-[18px] border border-white/[0.07] bg-[#16181d]">
            <SessionRow
              icon={currentPresentation.icon}
              iconColor={currentPresentation.iconColor}
              iconBg={currentPresentation.iconBg}
              title={currentSession ? currentPresentation.title : thisDeviceFallback.title}
              subtitle={currentSession ? currentPresentation.subtitle : thisDeviceFallback.subtitle}
              meta={currentSession ? formatSessionMeta(currentSession) : 'This phone · online'}
            />
            <Pressable
              onPress={handleTerminateOthers}
              disabled={busy}
              className="flex-row items-center border-t border-white/10 px-3.5 py-3.5 active:opacity-70"
            >
              <View className="mr-3 h-11 w-11 shrink-0 items-center justify-center">
                <Ionicons name="hand-left-outline" size={22} color="#f2545b" />
              </View>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="min-w-0 flex-1 text-[15.5px] font-bold text-[#f2545b]"
              >
                Terminate All Other Sessions
              </Text>
            </Pressable>
          </View>
          <Text numberOfLines={1} className="ml-7 mt-2 text-[13px] text-[#6f7788]">
            Logs out all devices except for this one.
          </Text>

          <Text numberOfLines={1} className="mb-2 ml-6 mt-6 px-1 text-[13px] font-semibold text-[#6f7788]">
            Active sessions
          </Text>
          <View className="mx-6 overflow-hidden rounded-[18px] border border-white/[0.07] bg-[#16181d]">
            {loading ? (
              <View className="items-center px-5 py-7">
                <ActivityIndicator color={BrandColors.primary} />
              </View>
            ) : otherSessions.length === 0 ? (
              <View className="items-center px-5 py-7">
                <Text className="text-[15px] font-bold text-white">No other active sessions</Text>
                <Text className="mt-1.5 text-center text-[13px] leading-[18px] text-[#7a8194]">
                  When you sign in on Android TV or the web, those devices will show up here.
                </Text>
              </View>
            ) : (
              otherSessions.map((session, index) => {
                const info = presentDevice(session.userAgent);
                const isLast = index === otherSessions.length - 1;
                return (
                  <View key={session.id}>
                    <SessionRow
                      icon={info.icon}
                      iconColor={info.iconColor}
                      iconBg={info.iconBg}
                      title={info.title}
                      subtitle={info.subtitle}
                      meta={formatSessionMeta(session)}
                      onPress={() => handleTerminateSession(session)}
                      disabled={busy}
                    />
                    {!isLast || loadingMore ? (
                      <View className="ml-[68px] h-px bg-white/[0.07]" />
                    ) : null}
                  </View>
                );
              })
            )}
            {loadingMore ? (
              <View className="items-center justify-center py-4">
                <ActivityIndicator color={BrandColors.primary} />
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
