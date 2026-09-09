import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts as useFraunces,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { AppNavigator } from '@/navigation/AppNavigator';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* noop — splash pode já ter sido escondida em ambientes de dev */
});

export default function App() {
  const [frauncesCarregada] = useFraunces({
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
  });
  const [interCarregada] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const pronto = frauncesCarregada && interCarregada;

  const onLayoutRootView = useCallback(async () => {
    if (pronto) {
      await SplashScreen.hideAsync();
    }
  }, [pronto]);

  if (!pronto) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.paper }} onLayout={onLayoutRootView}>
        <StatusBar style="dark" />
        <AppNavigator />
      </View>
    </SafeAreaProvider>
  );
}
