import "../global.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { I18nManager, View } from "react-native";
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
import { SmoochSans_800ExtraBold } from "@expo-google-fonts/smooch-sans";

import { queryClient } from "../lib/queryClient";
import { useAuthStore } from "../lib/auth";
import { AppSplash } from "../components/ui/AppSplash";

if (!isRunningInExpoGo()) {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

type UpdateStatus = "downloading" | "ready" | null;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Heebo: Heebo_400Regular,
    Heebo_500Medium,
    Heebo_700Bold,
    SmoochSans_800ExtraBold,
  });

  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const isLoading = useAuthStore((s) => s.isLoading);
  const didHideSplashRef = useRef(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [otaDone, setOtaDone] = useState(false);
  const updateCheckedRef = useRef(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const checkForOtaUpdate = useCallback(async () => {
    if (__DEV__ || isRunningInExpoGo() || updateCheckedRef.current) {
      setOtaDone(true);
      return;
    }
    updateCheckedRef.current = true;

    try {
      const check = await Updates.checkForUpdateAsync();
      if (!check.isAvailable) {
        setOtaDone(true);
        return;
      }

      setUpdateStatus("downloading");
      setDownloadProgress(0);

      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => Math.min(prev + 0.06, 0.92));
      }, 350);

      const result = await Updates.fetchUpdateAsync();
      clearInterval(progressInterval);

      if (result.isNew) {
        setDownloadProgress(1);
        setUpdateStatus("ready");
        await Updates.reloadAsync();
      } else {
        setOtaDone(true);
        setUpdateStatus(null);
      }
    } catch {
      setOtaDone(true);
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

  const showSplash = !fontsLoaded || isLoading || !otaDone || updateStatus;
  if (showSplash) {
    return <AppSplash updateStatus={updateStatus} progress={downloadProgress} />;
  }

  return (
    <View style={{ flex: 1 }}>
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
