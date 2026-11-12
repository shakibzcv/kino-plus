import React from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { BottomTabInset, BrandColors, MaxContentWidth } from '@/constants/theme';
import { deleteAccount } from '@/services/user-data';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your Kino+ account? This action cannot be undone and all your data (watchlist, continue watching, favorites) will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const success = await deleteAccount(user?.id || user?.email);
              if (success) {
                Alert.alert(
                  'Account Deleted',
                  'Your account has been permanently deleted. You will be signed out.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        signOut();
                        router.back();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  'Error',
                  'Failed to delete account. Please try again or contact support.',
                  [{ text: 'OK' }]
                );
              }
            } catch (err) {
              Alert.alert(
                'Error',
                'Failed to delete account. Please check your connection and try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

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

  if (!user) {
    return (
      <View className="flex-1 bg-[#0e1013]">
        <StatusBar barStyle="light-content" />
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'My Account',
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
                My Account
              </Text>
            ),
          }}
        />
        <View className="flex-1 items-center justify-center">
          <Ionicons name="person-outline" size={64} color="#3d4452" />
          <Text className="mt-4 text-[16px] font-semibold text-[#7a8194]">No account signed in</Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 rounded-2xl bg-[#f2545b] px-6 py-3"
          >
            <Text className="text-[14px] font-bold text-white">Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0e1013]">
      <StatusBar barStyle="light-content" />

      <Stack.Screen
        options={{
          headerShown: true,
          title: 'My Account',
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
              My Account
            </Text>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pt-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mx-auto w-full self-center" style={{ maxWidth: MaxContentWidth }}>
          {/* Profile Card */}
          <View className="mx-4 mb-6 items-center rounded-[18px] bg-[#16181d] p-6">
            {user?.photo ? (
              <Image
                source={{ uri: user.photo }}
                style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#20232b', borderWidth: 3, borderColor: '#f2545b' }}
              />
            ) : (
              <View className="h-[100px] w-[100px] items-center justify-center rounded-full bg-[#20232b]">
                <Text className="text-[40px] font-extrabold text-white">
                  {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}

            <Text className="mt-4 text-[22px] font-bold text-white tracking-tight">
              {user.name}
            </Text>
            <Text className="mt-1 text-[14px] text-[#8c93a4]">{user.email}</Text>
          </View>

          {/* Account Details */}
          <Text className="mx-4 mb-1.5 px-0.5 text-[11px] font-extrabold tracking-widest uppercase text-[#737b8d]">Account Details</Text>
          <View className="mx-4 overflow-hidden rounded-2xl bg-[#16181d]">
            <View className="flex-row items-center justify-between px-4 py-3.5">
              <View className="flex-1">
                <Text className="text-[12px] font-semibold text-[#7a8194]">Account Type</Text>
                <Text className="mt-0.5 text-[15px] font-semibold text-white">Free Account</Text>
              </View>
              <Ionicons name="person-outline" size={20} color="#5e6576" />
            </View>
            <View className="h-[0.5px] bg-white/6 ml-4" />
            <View className="flex-row items-center justify-between px-4 py-3.5">
              <View className="flex-1">
                <Text className="text-[12px] font-semibold text-[#7a8194]">Member Since</Text>
                <Text className="mt-0.5 text-[15px] font-semibold text-white">January 2026</Text>
              </View>
              <Ionicons name="calendar-outline" size={20} color="#5e6576" />
            </View>
            <View className="h-[0.5px] bg-white/6 ml-4" />
            <View className="flex-row items-center justify-between px-4 py-3.5">
              <View className="flex-1">
                <Text className="text-[12px] font-semibold text-[#7a8194]">Authentication</Text>
                <Text className="mt-0.5 text-[15px] font-semibold text-white">Google Sign-In</Text>
              </View>
              <Ionicons name="logo-google" size={20} color="#5e6576" />
            </View>
          </View>

          {/* Danger Zone */}
          <Text className="mx-4 mt-6 mb-1.5 px-0.5 text-[11px] font-extrabold tracking-widest uppercase text-[#737b8d]">Danger Zone</Text>
          <View className="mx-4 overflow-hidden rounded-2xl bg-[#16181d]">
            <Pressable
              onPress={handleSignOut}
              className="flex-row items-center justify-between px-4 py-3.5 active:bg-white/4"
            >
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-white">Sign Out</Text>
                <Text className="mt-0.5 text-[12px] text-[#7a8194]">Sign out from this device</Text>
              </View>
              <Ionicons name="log-out-outline" size={20} color="#5e6576" />
            </Pressable>
            <View className="h-[0.5px] bg-white/6 ml-4" />
            <Pressable
              onPress={handleDeleteAccount}
              disabled={isDeleting}
              className="flex-row items-center justify-between px-4 py-3.5 active:bg-white/4"
            >
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-[#f2545b]">
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </Text>
                <Text className="mt-0.5 text-[12px] text-[#7a8194]">Permanently delete your account</Text>
              </View>
              {isDeleting ? (
                <ActivityIndicator size={20} color="#f2545b" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#f2545b" />
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
