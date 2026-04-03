import "../global.css";
import { useEffect, useRef } from "react";
import { I18nManager, Platform, View } from "react-native";
import { Stack, SplashScreen } from "expo-router";
import { isRunningInExpoGo } from "expo";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  Heebo_400Regular,
  Heebo_500Medium,
  Heebo_700Bold,
} from "@expo-google-fonts/heebo";

import { queryClient } from "../lib/queryClient";
import { useAuthStore } from "../lib/auth";
import { AppSplash } from "../components/ui/AppSplash";

/**
 * ב-Expo Go אין ספלאש נייטיב מותאם אישית — preventAutoHideAsync נשאר "תקוע" בלי hide מתאים
 * ואז רואים רק את ספלאש ברירת המחדל של Go. ב-dev client / build אמיתי שומרים על המנגנון הרגיל.
 */
if (!isRunningInExpoGo()) {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Heebo: Heebo_400Regular,
    Heebo_500Medium,
    Heebo_700Bold,
  });

  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const isLoading = useAuthStore((s) => s.isLoading);
  const didHideSplashRef = useRef(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!fontsLoaded || isLoading || didHideSplashRef.current) return;
    didHideSplashRef.current = true;
    const id = requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {});
    });
    return () => cancelAnimationFrame(id);
  }, [fontsLoaded, isLoading]);

  if (!fontsLoaded || isLoading) {
    return <AppSplash />;
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
