import { useState, useCallback, useEffect } from "react";
import {
  View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Notifications from "expo-notifications";

import { api } from "../../lib/api";
import { timeAgo } from "../../lib/timeAgo";
import { EmptyState } from "../../components/ui/EmptyState";
import { rowRtl } from "../../lib/rowRtl";
import type { ProfileNotification } from "../../lib/types";

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "post_like":
      return <Ionicons name="heart" size={13} color="#ef4444" />;
    case "post_comment":
      return <Ionicons name="chatbubble" size={13} color="#3b82f6" />;
    case "new_open_request":
    case "request_approved":
    case "request_rejected":
      return <Ionicons name="cube" size={13} color="#10b981" />;
    default:
      return <Ionicons name="notifications" size={13} color="#94a3b8" />;
  }
}

function NotificationItem({
  notification,
  onPress,
}: {
  notification: ProfileNotification;
  onPress: () => void;
}) {
  const avatarUrl = (notification.metadata?.actorAvatarUrl as string) || null;
  const isRead = !!notification.readAt;

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${rowRtl()} items-start gap-3 px-4 py-3.5 ${isRead ? "bg-white" : "bg-emerald-50/40"}`}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View className="relative mt-0.5">
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} contentFit="cover" />
        ) : (
          <View className="w-11 h-11 rounded-full bg-emerald-500 items-center justify-center">
            <Ionicons name="notifications" size={20} color="white" />
          </View>
        )}
        <View className="absolute -bottom-0.5 -start-0.5 w-5 h-5 rounded-full bg-white items-center justify-center" style={{ elevation: 1 }}>
          <NotificationIcon type={notification.type} />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className={`${rowRtl()} items-start justify-between gap-2`}>
          <Text
            className={`text-sm leading-5 flex-1 ${isRead ? "text-slate-700" : "text-slate-900 font-heebo-bold"}`}
            style={{ writingDirection: "rtl", textAlign: "right" }}
            style={{ writingDirection: "rtl" }}
          >
            {notification.title}
          </Text>
          {!isRead && <View className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500" />}
        </View>
        {notification.body && (
          <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={2} style={{ writingDirection: "rtl", textAlign: "right" }}>
            {notification.body}
          </Text>
        )}
        <Text className="text-[11px] text-slate-400 mt-1" style={{ writingDirection: "rtl", textAlign: "right" }}>
          {timeAgo(notification.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ notifications: ProfileNotification[] }>("/notifications"),
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  async function handleMarkRead(id: string) {
    queryClient.setQueryData(["notifications"], (old: typeof data) => {
      if (!old) return old;
      return {
        notifications: old.notifications.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        ),
      };
    });
    queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    await api("/notifications/read", { method: "POST", body: { id } });
  }

  async function handleMarkAllRead() {
    if (markAllLoading) return;
    setMarkAllLoading(true);
    queryClient.setQueryData(["notifications"], (old: typeof data) => {
      if (!old) return old;
      return {
        notifications: old.notifications.map((n) => ({
          ...n,
          readAt: n.readAt || new Date().toISOString(),
        })),
      };
    });
    queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    try {
      await api("/notifications/read-all", { method: "POST" });
    } catch {}
    setMarkAllLoading(false);
  }

  function handleNotificationPress(n: ProfileNotification) {
    if (!n.readAt) handleMarkRead(n.id);
    const phone = n.metadata?.actorPhone as string;
    if (phone && (n.type === "post_like" || n.type === "post_comment")) {
      const normalized = phone.replace(/\D/g, "").slice(-10);
      if (normalized) router.push(`/profile/${normalized}`);
    }
  }

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.actorPhone) {
        const phone = String(data.actorPhone).replace(/\D/g, "").slice(-10);
        if (phone) router.push(`/profile/${phone}`);
      }
      refetch();
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    });
    return () => subscription.remove();
  }, [router, refetch, queryClient]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className={`px-4 py-3 ${rowRtl()} items-center justify-between border-b border-slate-100`}>
        <View className={`${rowRtl()} items-center gap-2`}>
          <Text className="text-lg font-heebo-bold text-slate-900" style={{ writingDirection: "rtl", textAlign: "right" }}>התראות</Text>
          {unreadCount > 0 && (
            <Text className="text-sm font-heebo-medium text-emerald-500">({unreadCount} חדשות)</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markAllLoading}
            className={`${rowRtl()} items-center gap-1.5 px-3 py-1.5 rounded-lg min-h-[36px] ${markAllLoading ? "opacity-70" : ""}`}
          >
            {markAllLoading ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={14} color="#059669" />
                <Text className="text-xs font-heebo-medium text-emerald-600">סמן הכל</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handleNotificationPress(item)}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-px bg-slate-50" />}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
              title="אין התראות"
              subtitle="כשמישהו יגיב או יעשה לייק — תקבל התראה כאן"
            />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#10b981"
              colors={["#10b981"]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
