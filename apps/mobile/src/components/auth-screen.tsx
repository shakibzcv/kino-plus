import React, { useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { KinoLogo } from '@/components/kino-logo';
import { GoogleIcon } from '@/components/google-signin-button';

// ── Static poster asset dictionary for React Native bundling ──────────────────
const POSTER_ASSETS: Record<number, any> = {
  1: require('@/assets/posters/poster-1.jpg'),
  2: require('@/assets/posters/poster-2.jpg'),
  3: require('@/assets/posters/poster-3.jpg'),
  4: require('@/assets/posters/poster-4.jpg'),
  5: require('@/assets/posters/poster-5.jpg'),
  6: require('@/assets/posters/poster-6.jpg'),
  7: require('@/assets/posters/poster-7.jpg'),
  8: require('@/assets/posters/poster-8.jpg'),
  9: require('@/assets/posters/poster-9.jpg'),
  10: require('@/assets/posters/poster-10.jpg'),
  11: require('@/assets/posters/poster-11.jpg'),
  12: require('@/assets/posters/poster-12.jpg'),
  13: require('@/assets/posters/poster-13.jpg'),
  14: require('@/assets/posters/poster-14.jpg'),
  15: require('@/assets/posters/poster-15.jpg'),
  16: require('@/assets/posters/poster-16.jpg'),
  17: require('@/assets/posters/poster-17.jpg'),
  18: require('@/assets/posters/poster-18.jpg'),
  19: require('@/assets/posters/poster-19.jpg'),
  20: require('@/assets/posters/poster-20.jpg'),
};

const COL1_POSTERS = [1, 2, 3, 4, 5, 6, 7];
const COL2_POSTERS = [8, 9, 10, 11, 12, 13, 14];
const COL3_POSTERS = [15, 16, 17, 18, 19, 20, 1];

const POSTER_GAP = 10;

// ── Silky 60/120fps Infinite Native-Driver Vertical Marquee Column ─────────────
interface PosterColumnProps {
  posters: number[];
  direction: 'up' | 'down';
  duration: number;
  cardWidth: number;
  cardHeight: number;
  gap?: number;
}

const PosterColumn = memo(function PosterColumn({
  posters,
  direction,
  duration,
  cardWidth,
  cardHeight,
  gap = POSTER_GAP,
}: PosterColumnProps) {
  const singleSetHeight = posters.length * (cardHeight + gap);
  const anim = useRef(new Animated.Value(direction === 'up' ? 0 : -singleSetHeight)).current;

  useEffect(() => {
    anim.setValue(direction === 'up' ? 0 : -singleSetHeight);

    const animation = Animated.loop(
      Animated.timing(anim, {
        toValue: direction === 'up' ? -singleSetHeight : 0,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [anim, direction, duration, singleSetHeight]);

  const items = [...posters, ...posters];

  return (
    <View style={{ width: cardWidth, overflow: 'hidden' }}>
      <Animated.View
        style={{
          transform: [{ translateY: anim }],
          gap,
        }}
      >
        {items.map((posterId, idx) => (
          <View
            key={`${posterId}-${idx}`}
            style={{
              width: cardWidth,
              height: cardHeight,
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: '#15171e',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <ExpoImage
              source={POSTER_ASSETS[posterId]}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority={idx < 4 ? 'high' : 'normal'}
            />
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

// ── Main Mobile Auth Screen ───────────────────────────────────────────────────
export function AuthScreen() {
  const { isGoogleSigningIn, signInWithGoogle, error } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // 3-column waterfall sizing matching mobile viewport
  const horizontalPadding = 12;
  const totalGaps = POSTER_GAP * 2;
  const availableWidth = width - horizontalPadding * 2 - totalGaps;
  const cardWidth = Math.max(90, Math.floor(availableWidth / 3));
  const cardHeight = Math.round(cardWidth * 1.5);

  // Subtle press scale feedback animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* 🌊 Waterfall Poster Columns Animation (Top-to-Bottom / Bottom-to-Top like Web & Desktop) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.marqueeRow, { paddingHorizontal: horizontalPadding }]}>
          <PosterColumn
            posters={COL1_POSTERS}
            direction="down"
            duration={34000}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
          />
          <PosterColumn
            posters={COL2_POSTERS}
            direction="up"
            duration={28000}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
          />
          <PosterColumn
            posters={COL3_POSTERS}
            direction="down"
            duration={38000}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
          />
        </View>

        {/* Ambient Top Glow Aura */}
        <View
          style={[
            styles.ambientGlow,
            {
              width: width * 0.9,
              height: width * 0.9,
              borderRadius: (width * 0.9) / 2,
              top: -width * 0.25,
              left: (width - width * 0.9) / 2,
            },
          ]}
        />

        {/* Top Vignette Gradient for header contrast */}
        <LinearGradient
          colors={['rgba(10, 11, 14, 0.92)', 'rgba(10, 11, 14, 0.4)', 'transparent']}
          locations={[0, 0.6, 1]}
          style={styles.topVignette}
        />

        {/* Bottom Fade Gradient for text legibility and grounded bottom card */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(10, 11, 14, 0.55)',
            'rgba(10, 11, 14, 0.92)',
            '#0a0b0e',
            '#0a0b0e',
          ]}
          locations={[0, 0.25, 0.6, 0.85, 1]}
          style={styles.bottomVignette}
        />
      </View>

      {/* ── Foreground Screen Structure ── */}
      <View style={styles.foreground}>
        {/* Top Brand Header — top-left aligned like Netflix/Disney+ */}
        <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 12) }]}>
          <KinoLogo size="md" useImage={false} />
        </View>

        {/* Bottom Cohesive Hero & Action Card */}
        <View style={[styles.bottomCard, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Main Headline */}
          <Text style={styles.headline}>
            Endless Movies, Series &{'\n'}
            <Text style={styles.headlineHighlight}>Blockbusters</Text>
          </Text>

          {/* Subheadline */}
          <Text style={styles.subheadline}>
            Stream thousands of blockbusters and binge-worthy series in 4K HDR. Sign in to resume
            on any screen.
          </Text>

          {/* Error Banner (if any) */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={17} color="#f2545b" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── Official Google Sign-In Pill Button ── */}
          <Pressable
            onPress={signInWithGoogle}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isGoogleSigningIn}
            style={styles.googleButtonWrapper}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <Animated.View
              style={[
                styles.googleButton,
                { transform: [{ scale: scaleAnim }] },
                isGoogleSigningIn && styles.buttonDisabled,
              ]}
            >
              {isGoogleSigningIn ? (
                <View style={styles.buttonInner}>
                  <ActivityIndicator size="small" color="#1F1F1F" />
                  <Text style={styles.googleButtonText}>Connecting to Google...</Text>
                </View>
              ) : (
                <View style={styles.buttonInner}>
                  <GoogleIcon size={22} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
              )}
            </Animated.View>
          </Pressable>

          {/* Fine Print Footnote */}
          <Text style={styles.footnote}>
            By continuing, you agree to Kino+ Terms of Service & Privacy Policy.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b0e',
  },
  marqueeRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: POSTER_GAP,
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(242, 84, 91, 0.16)',
    filter: 'blur(50px)',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
  },
  foreground: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topHeader: {
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  bottomCard: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  headline: {
    fontSize: 27,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 34,
    letterSpacing: -0.5,
    textAlign: 'center',
    maxWidth: 340,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  headlineHighlight: {
    color: '#f2545b',
  },
  subheadline: {
    fontSize: 13.5,
    color: '#9ba1b0',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 12,
    maxWidth: 340,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  errorBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(242, 84, 91, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(242, 84, 91, 0.3)',
  },
  errorText: {
    flex: 1,
    color: '#f2545b',
    fontSize: 12.5,
    fontWeight: '500',
  },
  googleButtonWrapper: {
    width: '100%',
    marginTop: 6,
  },
  googleButton: {
    width: '100%',
    height: 54,
    backgroundColor: '#ffffff',
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  googleButtonText: {
    color: '#1F1F1F',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footnote: {
    textAlign: 'center',
    color: '#606674',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    maxWidth: 320,
  },
});
