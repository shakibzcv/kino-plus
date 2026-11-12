import '../global.css';
import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, BackHandler } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';

import { PaperProvider, MD3DarkTheme } from 'react-native-paper';

import { AuthScreen } from '@/components/auth-screen';
import { IntroAnimation } from '@/components/intro-animation';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { UserDataProvider } from '@/context/user-data-context';
import { DownloadProvider } from '@/context/download-context';

const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#f2545b',
    background: '#0a0b0e',
    surface: '#15171e',
    surfaceVariant: '#212530',
    onSurface: '#ffffff',
    onSurfaceVariant: '#8a90a0',
  },
};

const TAB_PATHS = new Set(['/', '/movies', '/tv-shows', '/categories', '/settings']);

// Dismiss default OS splash screen as early as possible so our custom splash screen takes over
SplashScreen.hideAsync().catch(() => {});

function RootNavigation() {
  const { user, isGuest, isLoading } = useAuth();
  const pathname = usePathname();

  // Exit the app from a main tab. Nested screens pop normally.
  useEffect(() => {
    if (!user && !isGuest) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (TAB_PATHS.has(pathname)) {
        BackHandler.exitApp();
        return true;
      }
      return false;
    });

    return () => sub.remove();
  }, [user, isGuest, pathname]);

  // Clean seamless dark background while auth resolves, with zero loading spinners
  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#0a0b0e' }} />;
  }

  if (!user && !isGuest) {
    return <AuthScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0b0e' },
        headerShadowVisible: false,
        headerTintColor: '#ffffff',
        contentStyle: { backgroundColor: '#0a0b0e' },
        animation: 'none',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="devices" />
      <Stack.Screen name="watchlist" />
      <Stack.Screen name="account" />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="details/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="category/[category]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showIntro, setShowIntro] = useState(true);

  // Load custom fonts and guarantee they are ready before playing the intro animation
  const [fontsLoaded] = useFonts({
    RubikMarkerHatch: require('@/assets/fonts/RubikMarkerHatch-Regular.ttf'),
    'RubikMarkerHatch-Regular': require('@/assets/fonts/RubikMarkerHatch-Regular.ttf'),
  });

  // Once fonts are loaded, dismiss native splash so our custom IntroAnimation plays with the custom font
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  // Render a clean seamless dark view during the brief font load (~30ms)
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#0a0b0e' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0a0b0e' }}>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthProvider>
            <UserDataProvider>
              <DownloadProvider>
                {showIntro ? (
                  <IntroAnimation
                    onComplete={() => setShowIntro(false)}
                    duration={2000}
                  />
                ) : (
                  <RootNavigation />
                )}
              </DownloadProvider>
            </UserDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
