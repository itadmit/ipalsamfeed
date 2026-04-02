import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/auth";

/** פעמון + באדג' אדום עם מספר התראות שלא נקראו (כמו באינסטגרם) */
export function HeaderNotificationBell() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => api<{ count: number }>("/notifications/unread-count"),
    refetchInterval: 20000,
    enabled: isAuthenticated,
  });

  const count = data?.count ?? 0;

  return (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/notifications")}
      className="p-2 -m-1"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel="התראות"
    >
      <View className="relative">
        <Ionicons name="notifications-outline" size={26} color="#1e293b" />
        {count > 0 ? (
          <View
            className="absolute min-w-[18px] h-[18px] rounded-full bg-red-500 items-center justify-center px-1"
            style={{ top: -4, end: -6 }}
          >
            <Text className="text-white text-[10px] font-heebo-bold leading-[12px]">
              {count > 99 ? "99+" : String(count)}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
