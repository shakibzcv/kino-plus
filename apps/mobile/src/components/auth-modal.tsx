import React from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors, Spacing } from '@/constants/theme';
import { KinoLogo } from '@/components/kino-logo';
import { GoogleIcon } from '@/components/google-signin-button';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onGoogleSignIn: () => void;
  isGoogleSigningIn: boolean;
  authError: string | null;
}

export function AuthModal({
  visible,
  onClose,
  onGoogleSignIn,
  isGoogleSigningIn,
  authError,
}: AuthModalProps) {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/82 justify-end">
        <Pressable
          className="flex-1"
          onPress={onClose}
        />

        <View
          className="bg-[#16181d] rounded-t-[24px] px-4 pt-2 border-t border-white/10 shadow-2xl"
          style={{ paddingBottom: Math.max(safeAreaInsets.bottom, 36) }}
        >
          <View className="items-center mb-2 relative">
            <View className="w-10 h-1 rounded-full bg-white/25 my-1.5" />
            <Pressable
              onPress={onClose}
              className="absolute right-0 top-0 w-8 h-8 rounded-full bg-white/8 items-center justify-center active:bg-white/15"
              hitSlop={12}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={18} color="#ffffff" />
            </Pressable>
          </View>

          {/* Brand Logo */}
          <View className="items-center mb-3">
            <KinoLogo size="lg" />
          </View>

          <Text className="text-white text-[24px] font-extrabold text-center mb-2">Sign In to Kino+</Text>
          <Text className="text-[#8a91a0] text-[14px] text-center mb-3 leading-5">
            Unlimited movies, TV shows, and live channels.
          </Text>

          {authError && (
            <View className="bg-[rgba(242,84,91,0.12)] border border-[rgba(242,84,91,0.3)] rounded-xl p-3 mb-3">
              <Text className="text-[#f2545b] text-[13px] text-center">{authError}</Text>
            </View>
          )}

          {/* Google Sign-In (Official Pill Design matching screenshot) */}
          <Pressable
            onPress={onGoogleSignIn}
            disabled={isGoogleSigningIn}
            className="w-full"
            accessibilityRole="button"
          >
            {({ pressed }) => (
              <View
                className="flex-row items-center justify-center bg-white rounded-[28px] py-3.5 px-6 gap-3 shadow-sm"
                style={[
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  isGoogleSigningIn && { opacity: 0.6 },
                  {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  },
                ]}
              >
                {isGoogleSigningIn ? (
                  <ActivityIndicator color="#1F1F1F" size="small" />
                ) : (
                  <>
                    <GoogleIcon size={20} />
                    <Text className="text-[#1F1F1F] text-[16px] font-semibold">Sign in with Google</Text>
                  </>
                )}
              </View>
            )}
          </Pressable>

          <Text className="text-[#8a91a0] text-[12px] text-center mt-3 leading-4">
            By continuing, you agree to Kino+ Terms of Use &amp; Privacy Policy.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
