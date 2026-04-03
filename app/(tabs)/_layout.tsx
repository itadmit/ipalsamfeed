import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { Redirect, Tabs } from "expo-router";
import { Platform, Pressable, Text, View } from "react-native";
import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/auth";
import { tabBarLayoutStyle } from "../../lib/rowRtl";

function TabBarIcon({ name, color, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
  return <Ionicons name={name} size={22} color={color} style={{ marginBottom: -2 }} />;
}

/**
 * כפתור compose: אותה פריסה כמו BottomTabItem — padding 5, אייקון 22 ללא שינוי margin, תווית 10px.
 * רק עוטפים אייקון+תווית ברקע ירוק מעוגל (ללא paddingTop/Bottom נוספים פנימיים).
 */
function ComposeTabBarButton(props: BottomTabBarButtonProps) {
  const {
    children: _children,
    style: _tabNavStyle,
    ref: _ref,
    onPress,
    onLongPress,
    href: _href,
    accessibilityState,
    testID,
  } = props;
  const focused = accessibilityState?.selected;
  const fill = focused ? "#059669" : "#10b981";
  const fillPressed = "#047857";

  return (
    <View style={{ flex: 1, minWidth: 0, overflow: "visible" }}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        accessibilityLabel="יצירת פוסט חדש"
        onPress={onPress}
        onLongPress={onLongPress}
        hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
        android_ripple={{ color: "rgba(255,255,255,0.3)" }}
        style={({ pressed }) => ({
          flex: 1,
          width: "100%",
          padding: 5,
          alignItems: "center",
          justifyContent: "flex-start",
        })}
      >
        {({ pressed }) => (
          <View
            style={{
              alignItems: "center",
              justifyContent: "flex-start",
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingTop:8,
              paddingBottom: 0,
              backgroundColor: pressed ? fillPressed : fill,
            }}
          >
            <Ionicons name="create" size={22} color="#ffffff" />
            <Text
              style={{
                fontFamily: "Heebo",
                fontSize: 10,
                lineHeight: 12,
                paddingTop:4,
                paddingBottom: 4,
                color: "rgba(255,255,255,0.95)",
                writingDirection: "rtl",
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              חדש
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
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
    <View className="absolute -top-1 -end-2 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
      <Text className="text-white text-[10px] font-heebo-bold">{data.count > 9 ? "9+" : data.count}</Text>
    </View>
  );
}

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      initialRouteName="feed"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#10b981",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          borderTopColor: "#e2e8f0",
          backgroundColor: "#ffffff",
          minHeight: 56,
          height: Platform.select({ ios: 64, android: 60, default: 64 }),
          paddingBottom: Platform.OS === "ios" ? 10 : 8,
          paddingTop: 6,
          ...tabBarLayoutStyle(),
        },
        tabBarLabelStyle: {
          fontFamily: "Heebo",
          fontSize: 10,
          writingDirection: "rtl",
        },
      }}
    >
      {/* direction: "rtl" in tabBarStyle ensures first JSX tab = rightmost visually */}
      <Tabs.Screen
        name="feed"
        options={{
          title: "פיד",
          tabBarIcon: ({ color, focused }) => (
            <View>
              <TabBarIcon name={focused ? "newspaper" : "newspaper-outline"} color={color} focused={focused} />
              <NotificationBadge />
            </View>
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
        name="compose"
        options={{
          title: "חדש",
          tabBarAccessibilityLabel: "יצירת פוסט חדש",
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (p) => <ComposeTabBarButton {...p} />,
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
        name="settings"
        options={{
          title: "הגדרות",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "settings" : "settings-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: "התראות",
        }}
      />
    </Tabs>
  );
}
