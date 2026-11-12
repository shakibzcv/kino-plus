import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/auth-context';
import { Spacing } from '@/constants/theme';

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <ExpoImage
      source={require('@/assets/images/g-logo.png')}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}

export function GoogleSignInButton() {
  const { user, isGoogleSigningIn, isLoading, error, signInWithGoogle, signOut, clearError } =
    useAuth();
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3c87f7" />
        <ThemedText type="small" themeColor="textSecondary">
          Checking Google session...
        </ThemedText>
      </View>
    );
  }

  if (user) {
    return (
      <ThemedView type="backgroundElement" style={styles.userCard}>
        <View style={styles.userHeader}>
          {user.photo ? (
            <ExpoImage source={{ uri: user.photo }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </ThemedText>
            </View>
          )}

          <View style={styles.userInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.onlineDot} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.connectedText}>
                Connected with Google
              </ThemedText>
            </View>
            <ThemedText type="default" style={styles.userName}>
              {user.name || 'Google User'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.userEmail}>
              {user.email}
            </ThemedText>
          </View>
        </View>

        <Pressable
          onPress={signOut}
          style={({ pressed }) => [
            styles.signOutButton,
            {
              backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
              borderColor: theme.backgroundSelected,
            },
          ]}
        >
          <ThemedText type="small" style={styles.signOutText}>
            Sign Out
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <Pressable onPress={clearError} style={styles.errorBanner}>
          <ThemedText type="small" style={styles.errorText}>
            {error} (tap to dismiss)
          </ThemedText>
        </Pressable>
      )}

      <Pressable
        onPress={signInWithGoogle}
        disabled={isGoogleSigningIn}
        style={({ pressed }) => [
          styles.button,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          isGoogleSigningIn && { opacity: 0.6 },
        ]}
      >
        {isGoogleSigningIn ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator size="small" color="#1F1F1F" />
            <ThemedText type="default" style={styles.buttonText}>
              Connecting to Google...
            </ThemedText>
          </View>
        ) : (
          <View style={styles.buttonContent}>
            <GoogleIcon size={20} />
            <ThemedText type="default" style={styles.buttonText}>
              Sign in with Google
            </ThemedText>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 380,
    gap: Spacing.two,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.four,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      },
    }),
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1F1F1F',
  },
  userCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34A853',
  },
  connectedText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontWeight: '700',
    fontSize: 16,
  },
  userEmail: {
    fontSize: 13,
  },
  signOutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  signOutText: {
    fontWeight: '600',
    fontSize: 13,
  },
  errorBanner: {
    backgroundColor: 'rgba(234, 67, 53, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(234, 67, 53, 0.3)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  errorText: {
    color: '#EA4335',
    fontSize: 12,
    textAlign: 'center',
  },
});
