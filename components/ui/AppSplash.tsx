import { View, Text, ActivityIndicator, Platform, StatusBar } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

/**
 * מסך פתיחה בזמן טעינת פונטים / אימות — לוגו במרכז (גיבוי כשהספלאש הנייטיבי לא נרשם, למשל ב-Expo Go).
 */
export function AppSplash() {
  const padTop =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 56;
  const padBottom = Platform.OS === "android" ? 24 : 34;

  return (
    <LinearGradient
      colors={["#059669", "#0d9488", "#0f766e"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ paddingTop: padTop, paddingBottom: padBottom }}
      >
        <View
          className="rounded-[28px] bg-white/15 p-5 mb-5"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
          }}
        >
          <Image
            source={require("../../assets/images/icon.png")}
            style={{ width: 120, height: 120 }}
            contentFit="contain"
          />
        </View>
        <Text
          className="text-white text-3xl font-bold tracking-tight"
          style={{ textAlign: "center" }}
        >
          iPalsam
        </Text>
        <Text
          className="text-white/90 text-sm mt-2"
          style={{ textAlign: "center", writingDirection: "rtl" }}
        >
          הרשת החברתית הפנימית
        </Text>
        <Text
          className="text-white text-base font-heebo-bold mt-6"
          style={{ textAlign: "center", writingDirection: "rtl" }}
        >
          טוען…
        </Text>
        <ActivityIndicator color="#ffffff" size="large" style={{ marginTop: 16 }} />
      </View>
    </LinearGradient>
  );
}
