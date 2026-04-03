import "../global.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { I18nManager, Platform, View } from "react-native";
import { Stack, SplashScreen } from "expo-router";
import { isRunningInExpoGo } from "expo";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Updates from "expo-updates";
import {
  useFonts,
  Heebo_400Regular,
  Heebo_500Medium,
  Heebo_700Bold,
} from "@expo-google-fonts/heebo";

import { queryClient } from "../lib/queryClient";
import { useAuthStore } from "../lib/auth";
import { AppSplash } from "../components/ui/AppSplash";

if (!isRunningInExpoGo()) {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

type UpdateStatus = "checking" | "downloading" | "ready" | null;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Heebo: Heebo_400Regular,
    Heebo_500Medium,
    Heebo_700Bold,
  });

  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const isLoading = useAuthStore((s) => s.isLoading);
  const didHideSplashRef = useRef(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(null);
  const updateCheckedRef = useRef(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const checkForOtaUpdate = useCallback(async () => {
    if (__DEV__ || isRunningInExpoGo() || updateCheckedRef.current) return;
    updateCheckedRef.current = true;

    try {
      setUpdateStatus("checking");
      const check = await Updates.checkForUpdateAsync();
      if (!check.isAvailable) {
        setUpdateStatus(null);
        return;
      }

      setUpdateStatus("downloading");
      await Updates.fetchUpdateAsync();
      setUpdateStatus("ready");
      await Updates.reloadAsync();
    } catch {
      setUpdateStatus(null);
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      checkForOtaUpdate();
    }
  }, [fontsLoaded, isLoading, checkForOtaUpdate]);

  useEffect(() => {
    if (!fontsLoaded || isLoading || didHideSplashRef.current) return;
    didHideSplashRef.current = true;
    const id = requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {});
    });
    return () => cancelAnimationFrame(id);
  }, [fontsLoaded, isLoading]);

  if (!fontsLoaded || isLoading || updateStatus) {
    return <AppSplash updateStatus={updateStatus} />;
  }

  const rootWebRtl =
    Platform.OS === "web"
      ? ({ flex: 1, direction: "rtl" as const } as const)
      : { flex: 1 };

  return (
    <View style={rootWebRtl}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          {/* פרופיל ציבורי: מסך מלא מעל הטאבים — דומה לאינסטגרם (בלי בר תחתון) */}
          <Stack.Screen name="profile/[phone]" options={{ presentation: "card" }} />
        </Stack>
        <StatusBar style="dark" />
      </QueryClientProvider>
    </View>
  );
}
