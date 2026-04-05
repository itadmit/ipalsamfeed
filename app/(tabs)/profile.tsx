import { useCallback, useState } from "react";
import { View, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/auth";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { PostCard } from "../../components/posts/PostCard";
import { CreatePostForm } from "../../components/posts/CreatePostForm";
import { EmptyState } from "../../components/ui/EmptyState";
import type { ProfileResponse, PostPublishEvent } from "../../lib/types";
import { applyPublishEventToProfilePosts } from "../../lib/postPublishCache";

export default function MyProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const queryClient = useQueryClient();
  const phone = user?.phone?.replace(/\D/g, "").slice(-10) || "";

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["profile", phone],
    queryFn: () => api<ProfileResponse>(`/profile/${phone}`),
    enabled: !!phone,
  });

  const handlePublish = useCallback(
    (e: PostPublishEvent) => {
      queryClient.setQueryData(["profile", phone], (old: ProfileResponse | undefined) => {
        if (!old) return old;
        return { ...old, posts: applyPublishEventToProfilePosts(old.posts, e) };
      });
      if (e.type === "done") {
        queryClient.invalidateQueries({ queryKey: ["feed"] });
      }
    },
    [queryClient, phone]
  );

  const handlePostDeleted = useCallback((id: string) => {
    queryClient.setQueryData(["profile", phone], (old: ProfileResponse | undefined) => {
      if (!old) return old;
      return { ...old, posts: old.posts.filter((p) => p.id !== id) };
    });
  }, [queryClient, phone]);

  if (isLoading || !data) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
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
          <View>
            <ProfileHeader
              profile={data.profile}
              followersCount={data.followersCount}
              followingCount={data.followingCount}
              isFollowing={data.isFollowing}
              isOwner={data.isOwner}
              onEditProfile={() => router.push("/(tabs)/settings")}
            />
            <View className="px-4 pt-4">
              <CreatePostForm onPublish={handlePublish} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="camera-outline" title="אין עדיין פוסטים" subtitle="שתף את הפוסט הראשון שלך" />
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
    </SafeAreaView>
  );
}
