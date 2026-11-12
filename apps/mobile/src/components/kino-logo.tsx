import React from 'react';
import { View, Text, Image, ViewStyle, StyleProp } from 'react-native';
import { BrandColors } from '@/constants/theme';

interface KinoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
  useImage?: boolean;
}

const SIZES = {
  sm: { fontSize: 24, plusSize: 19, imgWidth: 84, imgHeight: 25 },
  md: { fontSize: 28, plusSize: 22, imgWidth: 104, imgHeight: 31 },
  lg: { fontSize: 36, plusSize: 28, imgWidth: 136, imgHeight: 41 },
  xl: { fontSize: 44, plusSize: 34, imgWidth: 168, imgHeight: 51 },
};

export function KinoLogo({ size = 'md', style, useImage = false }: KinoLogoProps) {
  const dim = SIZES[size];

  if (useImage) {
    return (
      <View className="flex-row items-baseline" style={style}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={{ width: dim.imgWidth, height: dim.imgHeight }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'baseline' }, style]}>
      <Text
        style={{
          color: '#f2545b',
          fontFamily: 'RubikMarkerHatch',
          fontSize: dim.fontSize,
          letterSpacing: -0.5,
          includeFontPadding: false,
          textShadowColor: 'rgba(0, 0, 0, 0.75)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 6,
        }}
      >
        k
      </Text>
      <Text
        style={{
          color: '#ffffff',
          fontFamily: 'RubikMarkerHatch',
          fontSize: dim.fontSize,
          letterSpacing: -0.5,
          includeFontPadding: false,
          textShadowColor: 'rgba(0, 0, 0, 0.75)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 6,
        }}
      >
        ino
      </Text>
      <Text
        style={{
          color: '#f2545b',
          fontFamily: 'RubikMarkerHatch',
          fontSize: dim.plusSize,
          includeFontPadding: false,
          marginLeft: 2,
          textShadowColor: 'rgba(0, 0, 0, 0.75)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 6,
        }}
      >
        +
      </Text>
    </View>
  );
}

export default KinoLogo;
