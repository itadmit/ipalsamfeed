import { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/auth";
import { PostCard } from "../../components/posts/PostCard";
import { CreatePostForm } from "../../components/posts/CreatePostForm";
import { Avatar } from "../../components/ui/Avatar";
import { EmptyState } from "../../components/ui/EmptyState";
import { HeaderNotificationBell } from "../../components/ui/HeaderNotificationBell";
import type { PostData, PostPublishEvent, SuggestedUser } from "../../lib/types";
import { applyPublishEventToFeedPages } from "../../lib/postPublishCache";
import { rtlMirrorHorizontalScroll, rowRtl } from "../../lib/rowRtl";

type FeedMode = "all" | "friends";

function SuggestedSlider({ users: initialUsers }: { users: SuggestedUser[] }) {
  const router = useRouter();
  const [visible, setVisible] = useState(initialUsers);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (visible.length === 0) return null;

  const mirrorHScroll = rtlMirrorHorizontalScroll();

  async function handleFollow(userId: string) {
    if (loadingId === userId) return;
    setLoadingId(userId);
    try {
      const res = await api<{ followed: boolean }>("/follows/toggle", {
        method: "POST",
        body: { targetUserId: userId },
      });
      if (res.followed) {
        setFollowedIds((prev) => new Set(prev).add(userId));
      }
    } catch {}
    finally {
      setLoadingId(null);
    }
  }

  return (
    <View className="bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ elevation: 1 }}>
      <View className={`${rowRtl()} items-center justify-between px-4 pt-3 pb-1`}>
        <Text className="text-sm font-heebo-bold text-slate-700" style={{ writingDirection: "rtl", textAlign: "right" }}>חברים מוצעים</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/explore")}>
          <Text className="text-xs text-emerald-500 font-heebo-medium">הצג הכל</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={mirrorHScroll ? { transform: [{ scaleX: -1 }] } : undefined}
        contentContainerStyle={{
          flexDirection: "row",
          paddingHorizontal: 12,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        {visible.map((u) => {
          const phone = (u.phone || "").replace(/\D/g, "").slice(-10);
          const isFollowed = followedIds.has(u.id);
          const isLoading = loadingId === u.id;
          return (
            <View
              key={u.id}
              style={mirrorHScroll ? { transform: [{ scaleX: -1 }] } : undefined}
              className="w-[120px] border border-slate-100 rounded-xl p-3 items-center"
            >
              <TouchableOpacity onPress={() => router.push(`/profile/${phone}`)} className="items-center gap-1.5">
                <Avatar src={u.avatarUrl} name={`${u.firstName} ${u.lastName}`} size={56} />
                <Text className="text-xs font-heebo-bold text-slate-800 text-center" numberOfLines={1}>
                  {u.firstName} {u.lastName}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => !isFollowed && !isLoading && handleFollow(u.id)}
                disabled={isLoading || isFollowed}
                className={`w-full py-2 min-h-[36px] rounded-lg items-center justify-center mt-2 ${isFollowed ? "bg-slate-100" : "bg-emerald-500"}`}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={isFollowed ? "#64748b" : "white"} />
                ) : (
                  <Text className={`text-xs font-heebo-bold ${isFollowed ? "text-slate-500" : "text-white"}`}>
                    {isFollowed ? "✓ עוקב" : "עקוב"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function FeedScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<FeedMode>("all");

  const { data: suggestedData } = useQuery({
    queryKey: ["suggested-users"],
    queryFn: () => api<{ users: SuggestedUser[] }>("/follows/suggested"),
  });

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching,
  } = useInfiniteQuery({
    queryKey: ["feed", mode],
    queryFn: async ({ pageParam = 0 }) => {
      return api<{ posts: PostData[]; hasMore: boolean }>(`/feed?offset=${pageParam}&limit=20&mode=${mode}`);
    },
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.hasMore) return undefined;
      return pages.reduce((sum, p) => sum + p.posts.length, 0);
    },
    initialPageParam: 0,
  });

  const allPosts = data?.pages.flatMap((p) => p.posts) ?? [];

  const handlePublish = useCallback(
    (e: PostPublishEvent) => {
      queryClient.setQueryData(["feed", mode], (old: typeof data) =>
        applyPublishEventToFeedPages(old, e)
      );
      if (e.type === "done") {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    },
    [queryClient, mode, data]
  );

  const handlePostDeleted = useCallback((id: string) => {
    queryClient.setQueryData(["feed", mode], (old: typeof data) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((p) => ({
          ...p,
          posts: p.posts.filter((post) => post.id !== id),
        })),
      };
    });
  }, [queryClient, mode, data]);

  function handleModeSwitch(newMode: FeedMode) {
    if (newMode === mode) return;
    setMode(newMode);
  }

  const renderHeader = () => (
    <View className="gap-4 mb-4">
      <CreatePostForm onPublish={handlePublish} />
      {suggestedData?.users && suggestedData.users.length > 0 && (
        <SuggestedSlider users={suggestedData.users} />
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Header */}
      <View className={`bg-white border-b border-slate-200 px-4 py-3 ${rowRtl()} items-center justify-between`}>
        <Text
          style={{
            fontFamily: "SmoochSans_800ExtraBold",
            fontSize: 24,
            color: "#0f172a",
            letterSpacing: -0.5,
          }}
        >
          iPalsam
        </Text>
        <HeaderNotificationBell />
      </View>

      {/* Mode tabs */}
      <View className={`bg-white border-b border-slate-200 ${rowRtl()}`}>
        <TouchableOpacity
          onPress={() => handleModeSwitch("all")}
          className={`flex-1 py-2.5 items-center relative`}
        >
          <Text className={`text-sm font-heebo-bold ${mode === "all" ? "text-emerald-600" : "text-slate-400"}`}>
            כל הפוסטים
          </Text>
          {mode === "all" && <View className="absolute bottom-0 start-4 end-4 h-0.5 bg-emerald-500 rounded-full" />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleModeSwitch("friends")}
          className={`flex-1 py-2.5 items-center relative`}
        >
          <Text className={`text-sm font-heebo-bold ${mode === "friends" ? "text-emerald-600" : "text-slate-400"}`}>
            חברים בלבד
          </Text>
          {mode === "friends" && <View className="absolute bottom-0 start-4 end-4 h-0.5 bg-emerald-500 rounded-full" />}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={allPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-4 mb-4">
              <PostCard
                post={item}
                isOwner={item.authorId === user?.id}
                sessionUserId={user?.id || ""}
                onDelete={handlePostDeleted}
              />
            </View>
          )}
          ListHeaderComponent={
            <View className="px-4 pt-4">{renderHeader()}</View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="newspaper-outline"
              title={mode === "friends" ? "אין פוסטים מחברים" : "אין עדיין פוסטים בפיד"}
              subtitle={mode === "friends" ? "גלו אנשים לעקוב" : undefined}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#94a3b8" />
              </View>
            ) : !hasNextPage && allPosts.length > 0 ? (
              <View className="py-8 items-center">
                <Text className="text-sm text-slate-500">הגעת לסוף הפיד</Text>
              </View>
            ) : null
          }
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
              tintColor="#10b981"
              colors={["#10b981"]}
            />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </SafeAreaView>
  );
}
