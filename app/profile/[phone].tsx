import { useCallback, useState } from "react";
import { View, FlatList, ActivityIndicator, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/auth";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { PostCard } from "../../components/posts/PostCard";
import { EmptyState } from "../../components/ui/EmptyState";
import type { ProfileResponse } from "../../lib/types";

export default function PublicProfileScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [followLoading, setFollowLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["profile", phone],
    queryFn: () => api<ProfileResponse>(`/profile/${phone}`),
    enabled: !!phone,
  });

  const handleFollow = useCallback(async () => {
    if (!data || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await api<{ followed: boolean }>("/follows/toggle", {
        method: "POST",
        body: { targetUserId: data.profile.id },
      });
      queryClient.setQueryData(["profile", phone], (old: ProfileResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          isFollowing: res.followed,
          followersCount: old.followersCount + (res.followed ? 1 : -1),
        };
      });
    } catch {}
    finally {
      setFollowLoading(false);
    }
  }, [data, phone, queryClient, followLoading]);

  const handlePostDeleted = useCallback((id: string) => {
    queryClient.setQueryData(["profile", phone], (old: ProfileResponse | undefined) => {
      if (!old) return old;
      return { ...old, posts: old.posts.filter((p) => p.id !== id) };
    });
  }, [queryClient, phone]);

  if (isLoading || !data) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]} style={{ direction: "rtl" }}>
      {/* Back — ימין המסך, מעט מתחת ל-safe area */}
      <View className="absolute top-16 right-4 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-white/80 rounded-full p-2"
          style={{ elevation: 2 }}
        >
          <Ionicons name="arrow-forward" size={22} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={data.posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View className={`px-4 mb-4 ${index === 0 ? "mt-5" : ""}`}>
            <PostCard
              post={item}
              isOwner={item.authorId === user?.id}
              sessionUserId={user?.id || ""}
              onDelete={handlePostDeleted}
            />
          </View>
        )}
        ListHeaderComponent={
          <ProfileHeader
            profile={data.profile}
            followersCount={data.followersCount}
            followingCount={data.followingCount}
            isFollowing={data.isFollowing}
            isOwner={data.isOwner}
            onFollow={handleFollow}
            followLoading={followLoading}
          />
        }
        ListEmptyComponent={
          <EmptyState icon="camera-outline" title="אין עדיין פוסטים" />
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </SafeAreaView>
  );
}
