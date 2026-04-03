import { View, Text, ActivityIndicator, Platform, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface AppSplashProps {
  updateStatus?: "downloading" | "ready" | null;
  progress?: number;
}

export function AppSplash({ updateStatus, progress = 0 }: AppSplashProps = {}) {
  const padTop =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 56;
  const padBottom = Platform.OS === "android" ? 24 : 34;

  const statusText = (() => {
    switch (updateStatus) {
      case "downloading":
        return "מוריד עדכון…";
      case "ready":
        return "מפעיל עדכון…";
      default:
        return "טוען…";
    }
  })();

  const showProgress = updateStatus === "downloading" || updateStatus === "ready";

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

        {showProgress ? (
          <View style={{ marginTop: 36, alignItems: "center", width: "100%" }}>
            <Text
              style={{
                fontSize: 14,
                color: "rgba(94, 234, 212, 0.7)",
                textAlign: "center",
                writingDirection: "rtl",
                marginBottom: 12,
              }}
            >
              {statusText}
            </Text>
            <View
              style={{
                width: "60%",
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(94, 234, 212, 0.15)",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  height: "100%",
                  borderRadius: 2,
                  backgroundColor: "#5eead4",
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 12,
                color: "rgba(94, 234, 212, 0.5)",
                marginTop: 8,
              }}
            >
              {Math.round(progress * 100)}%
            </Text>
          </View>
        ) : (
          <ActivityIndicator color="#5eead4" size="small" style={{ marginTop: 32 }} />
        )}
      </View>
    </LinearGradient>
  );
}
