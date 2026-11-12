/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const BrandColors = {
  primary: '#f2545b',
  primaryHover: '#e0434b',
  primaryLight: '#ff757b',
  primaryDark: '#cc3941',
  primaryRgb: '242, 84, 91',
  coral: '#f2545b',
  coralDeep: '#e0434b',
  coralLight: '#ff757b',
  coralGlow: 'rgba(242, 84, 91, 0.25)',

  // Surface Hierarchy
  surfaceBase: '#0e1013',
  surfaceElevated: '#16181d',
  surfaceCard: '#1c1e24',
  surfaceHover: '#242730',

  // Borders & Accents
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderHighlight: 'rgba(242, 84, 91, 0.4)',
  textMuted: '#a1a1aa',
} as const;

export const Colors = {
  light: {
    text: '#0e1013',
    background: '#ffffff',
    backgroundElement: '#f4f4f5',
    backgroundSelected: '#e4e4e7',
    surfaceCard: '#fafafa',
    textSecondary: '#71717a',
    primary: BrandColors.primary,
    border: 'rgba(0, 0, 0, 0.08)',
    borderHighlight: BrandColors.borderHighlight,
  },
  dark: {
    text: '#ffffff',
    background: '#0e1013',
    backgroundElement: '#16181d',
    backgroundSelected: '#242730',
    surfaceCard: '#1c1e24',
    textSecondary: '#a1a1aa',
    primary: BrandColors.primary,
    border: BrandColors.borderSubtle,
    borderHighlight: BrandColors.borderHighlight,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 88, android: 92 }) ?? 88;
export const MaxContentWidth = 800;
