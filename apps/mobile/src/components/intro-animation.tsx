import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors } from '@/constants/theme';

interface IntroAnimationProps {
  onComplete: () => void;
  duration?: number;
}

const BRAND_CHARS = ['k', 'i', 'n', 'o', '+'];

export function IntroAnimation({ onComplete, duration = 2000 }: IntroAnimationProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const insets = useSafeAreaInsets();
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Animated values for each character
  const charAnimations = useRef(
    BRAND_CHARS.map((char) => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(35),
      scale: new Animated.Value(0.4),
      isCoral: char === 'k' || char === '+',
      isPlus: char === '+',
    }))
  ).current;

  // Fade out the entire container smoothly into the app
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Character animations - staggered entrance like Netflix
    const charAnimationsSequence = charAnimations.map((anim, index) => {
      return Animated.sequence([
        Animated.delay(index * 110),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim.scale, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.back(1.4)),
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    // Fade out entire splash container near end of duration
    const fadeOutDelay = Math.max(800, duration - 400);
    const fadeOutAnimation = Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 400,
      delay: fadeOutDelay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    // Run staggered characters + container fadeout
    animationRef.current = Animated.parallel([
      ...charAnimationsSequence,
      fadeOutAnimation,
    ]);

    animationRef.current.start(({ finished }) => {
      if (finished) {
        setAnimationComplete(true);
        onComplete();
      }
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [duration, onComplete, containerOpacity]);

  if (animationComplete) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          opacity: containerOpacity,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0e1013" />
      <View style={styles.logoContainer}>
        {charAnimations.map((anim, index) => {
          const char = BRAND_CHARS[index];
          const isPlus = char === '+';
          return (
            <Animated.Text
              key={index}
              style={[
                styles.brandChar,
                isPlus && styles.plusChar,
                {
                  color: anim.isCoral ? BrandColors.primary : '#ffffff',
                  opacity: anim.opacity,
                  transform: [
                    { translateY: anim.translateY },
                    { scale: anim.scale },
                  ],
                },
              ]}
            >
              {char}
            </Animated.Text>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0e1013',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandChar: {
    fontFamily: 'RubikMarkerHatch',
    fontSize: 76,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(242, 84, 91, 0.35)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  plusChar: {
    fontSize: 58,
    marginLeft: 3,
  },
});
