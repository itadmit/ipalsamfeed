import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../lib/auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { View, Text } from "react-native";

function TabBarIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
  return <Ionicons name={name} size={22} color={color} style={{ marginBottom: -2 }} />;
}

function NotificationBadge() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => api<{ count: number }>("/notifications/unread-count"),
    refetchInterval: 30000,
    enabled: isAuthenticated,
  });

  if (!data?.count) return null;

  return (
    <View className="absolute -top-1 -right-2 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
      <Text className="text-white text-[10px] font-heebo-bold">{data.count > 9 ? "9+" : data.count}</Text>
    </View>
  );
}

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const profilePhone = user?.phone?.replace(/\D/g, "").slice(-10) || "";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#10b981",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          borderTopColor: "#e2e8f0",
          backgroundColor: "#ffffff",
          height: 58,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: "Heebo",
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "פיד",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "newspaper" : "newspaper-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "גלה",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "compass" : "compass-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "פרופיל",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "person" : "person-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "התראות",
          tabBarIcon: ({ color, focused }) => (
            <View>
              <TabBarIcon name={focused ? "notifications" : "notifications-outline"} color={color} focused={focused} />
              <NotificationBadge />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "הגדרות",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "settings" : "settings-outline"} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
