import { View, Text, ActivityIndicator, Platform, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface AppSplashProps {
  updateStatus?: "checking" | "downloading" | "ready" | "error" | "no-update" | null;
  errorMessage?: string | null;
}

export function AppSplash({ updateStatus, errorMessage }: AppSplashProps = {}) {
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
      case "error":
        return "שגיאת עדכון";
      case "no-update":
        return "אין עדכון חדש";
      default:
        return "טוען…";
    }
  })();

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
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
            fontFamily: "SmoochSans_800ExtraBold",
            fontSize: 56,
            color: "#5eead4",
            textAlign: "center",
            letterSpacing: -1,
            textShadowColor: "rgba(20, 184, 166, 0.4)",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 30,
          }}
        >
          iPalsam
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.5)",
            marginTop: 8,
            textAlign: "center",
            writingDirection: "rtl",
          }}
        >
          רשת חברתית גדודית
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "rgba(94, 234, 212, 0.7)",
            marginTop: 32,
            textAlign: "center",
            writingDirection: "rtl",
          }}
        >
          {statusText}
        </Text>
        {errorMessage ? (
          <Text
            style={{
              fontSize: 11,
              color: "rgba(255,100,100,0.8)",
              marginTop: 8,
              textAlign: "center",
              paddingHorizontal: 24,
            }}
            numberOfLines={3}
          >
            {errorMessage}
          </Text>
        ) : null}
        <ActivityIndicator color="#5eead4" size="small" style={{ marginTop: 12 }} />
      </View>
    </LinearGradient>
  );
}
