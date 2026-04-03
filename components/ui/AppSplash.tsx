import { View, Text, ActivityIndicator, Platform, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface AppSplashProps {
  updateStatus?: "checking" | "downloading" | "ready" | null;
}

export function AppSplash({ updateStatus }: AppSplashProps = {}) {
  const padTop =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 56;
  const padBottom = Platform.OS === "android" ? 24 : 34;

  const statusText = (() => {
    switch (updateStatus) {
      case "checking":
        return "בודק עדכונים…";
      case "downloading":
        return "מוריד עדכון…";
      case "ready":
        return "מפעיל עדכון…";
      default:
        return "טוען…";
    }
  })();

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
        <Text
          style={{
            fontSize: 52,
            fontWeight: "800",
            color: "#ffffff",
            textAlign: "center",
            letterSpacing: -1,
          }}
        >
          iPalsam
        </Text>
        <Text
          className="text-white/80 text-base mt-2"
          style={{ textAlign: "center", writingDirection: "rtl" }}
        >
          רשת חברתית גדודית
        </Text>
        <Text
          className="text-white/90 text-sm mt-8"
          style={{ textAlign: "center", writingDirection: "rtl" }}
        >
          {statusText}
        </Text>
        <ActivityIndicator color="#ffffff" size="small" style={{ marginTop: 12 }} />
      </View>
    </LinearGradient>
  );
}
