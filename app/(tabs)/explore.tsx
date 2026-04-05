import { useState, useCallback, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { api } from "../../lib/api";
import { hebrewTextInput } from "../../lib/hebrewInputStyle";
import { EmptyState } from "../../components/ui/EmptyState";
import type { ExploreProfile } from "../../lib/types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = (SCREEN_WIDTH - 32 - 16) / 3;

function ProfileCard({ profile }: { profile: ExploreProfile }) {
  const router = useRouter();
  const phone = (profile.phone || "").replace(/\D/g, "").slice(-10);
  const name = `${profile.firstName} ${profile.lastName}`;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/profile/${phone}`)}
      className="items-center mb-5"
      style={{ width: ITEM_SIZE }}
      activeOpacity={0.7}
    >
      <View className="rounded-full overflow-hidden border-2 border-slate-100" style={{ width: ITEM_SIZE * 0.85, height: ITEM_SIZE * 0.85 }}>
        {profile.avatarUrl ? (
          <Image
            source={{ uri: profile.avatarUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="w-full h-full bg-emerald-500 items-center justify-center">
            <Ionicons name="person" size={ITEM_SIZE * 0.35} color="rgba(255,255,255,0.8)" />
          </View>
        )}
      </View>
      <Text className="text-xs font-heebo-bold text-slate-800 mt-1.5 text-center" numberOfLines={1}>
        {name}
      </Text>
      {profile.rank && (
        <Text className="text-[10px] text-slate-400" numberOfLines={1}>{profile.rank}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExploreProfile[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isSearching = query.trim().length > 0;

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading,
  } = useInfiniteQuery({
    queryKey: ["explore"],
    queryFn: async ({ pageParam = 0 }) => {
      return api<{ profiles: ExploreProfile[]; hasMore: boolean }>(`/explore?offset=${pageParam}&limit=18`);
    },
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.hasMore) return undefined;
      return pages.reduce((sum, p) => sum + p.profiles.length, 0);
    },
    initialPageParam: 0,
    enabled: !isSearching,
  });

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api<{ profiles: ExploreProfile[] }>(`/explore?q=${encodeURIComponent(query.trim())}`);
        setSearchResults(res.profiles ?? []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  const allProfiles = data?.pages.flatMap((p) => p.profiles) ?? [];
  const displayList = isSearching ? (searchResults ?? []) : allProfiles;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="bg-white border-b border-slate-200 px-4 py-3">
        <Text className="text-lg font-heebo-bold text-slate-900" style={{ textAlign: "left" }}>
          גלה
        </Text>
      </View>

      {/* Search */}
      <View className="px-4 py-3 border-b border-slate-100">
        <View className="relative">
          <View className="pointer-events-none absolute top-[11px] start-3 z-[1]">
            <Ionicons name="search" size={18} color="#94a3b8" />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="חפש לפי שם, דרגה, פלוגה..."
            placeholderTextColor="#94a3b8"
            className="bg-slate-100 rounded-lg h-10 ps-10 pe-10 text-sm text-slate-900 text-right"
            style={hebrewTextInput}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              className="absolute top-[11px] end-3 z-[1]"
            >
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching && searching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : isLoading && !isSearching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : displayList.length === 0 ? (
        <EmptyState icon="search" title="לא נמצאו תוצאות" subtitle="נסה לחפש שם אחר" />
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProfileCard profile={item} />}
          numColumns={3}
          columnWrapperStyle={{ paddingHorizontal: 16, gap: 8 }}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 80 }}
          onEndReached={() => !isSearching && hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#94a3b8" />
              </View>
            ) : !isSearching && !hasNextPage && allProfiles.length > 0 ? (
              <View className="py-4 items-center">
                <Text className="text-xs text-slate-400">הגעת לסוף הרשימה</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
