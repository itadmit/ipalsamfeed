import { useState, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, TextInput, ActivityIndicator, Pressable, Alert,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Avatar } from "../ui/Avatar";
import { VerifiedBadge } from "../ui/VerifiedBadge";
import { getPostBackground, EMOJI_POSITIONS } from "../../lib/postBackgrounds";
import { timeAgo } from "../../lib/timeAgo";
import { api } from "../../lib/api";
import type { PostData, PostComment } from "../../lib/types";

interface PostCardProps {
  post: PostData;
  isOwner: boolean;
  sessionUserId: string;
  onDelete: (id: string) => void;
}

function EmojiOverlay({ emoji }: { emoji: string }) {
  return (
    <View className="absolute inset-0" style={{ overflow: "hidden" }} pointerEvents="none">
      {EMOJI_POSITIONS.map(([top, left, rotation, scale], i) => (
        <Text
          key={i}
          style={{
            position: "absolute",
            top: `${top}%`,
            left: `${left}%`,
            transform: [{ rotate: `${rotation}deg` }, { scale }],
            fontSize: 22,
            opacity: 0.35,
          }}
        >
          {emoji}
        </Text>
      ))}
    </View>
  );
}

export function PostCard({ post, isOwner, sessionUserId, onDelete }: PostCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localComments, setLocalComments] = useState<PostComment[]>(post.recentComments ?? []);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const lastTapRef = useRef(0);
  const likingRef = useRef(false);

  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const bg = getPostBackground(post.backgroundStyle);
  const hasImage = !!post.backgroundImageUrl;
  const hasGradient = !!bg && !hasImage;
  const authorName = `${post.author.firstName} ${post.author.lastName}`;
  const phone = post.author.phone?.replace(/\D/g, "");
  const profilePhone = phone?.length >= 10 ? phone.slice(-10) : phone?.length >= 9 ? `0${phone.slice(-9)}` : phone;

  const handleLike = useCallback(async () => {
    if (likingRef.current) return;
    likingRef.current = true;
    const optimistic = !liked;
    setLiked(optimistic);
    setLikesCount((c) => c + (optimistic ? 1 : -1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await api<{ liked: boolean; likesCount: number }>(`/posts/${post.id}/like`, { method: "POST" });
      setLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch {}
    likingRef.current = false;
  }, [liked, post.id]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      heartScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withDelay(300, withTiming(0, { duration: 200 }))
      );
      heartOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(400, withTiming(0, { duration: 200 }))
      );
      if (!liked) handleLike();
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    lastTapRef.current = now;
  }, [liked, handleLike, heartScale, heartOpacity]);

  async function handleDelete() {
    Alert.alert("מחיקת פוסט", "בטוח שרוצה למחוק?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "מחק", style: "destructive", onPress: async () => {
          setDeleting(true);
          try {
            await api(`/posts/${post.id}`, { method: "DELETE" });
            onDelete(post.id);
          } catch {}
          setDeleting(false);
        },
      },
    ]);
  }

  async function handleAddComment() {
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await api<{ comment: PostComment }>(`/posts/${post.id}/comments`, {
        method: "POST",
        body: { content: commentText.trim() },
      });
      setLocalComments((prev) => [res.comment, ...prev]);
      setCommentsCount((c) => c + 1);
      setCommentText("");
    } catch {}
    setSubmittingComment(false);
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await api(`/posts/${post.id}/comments/${commentId}`, { method: "DELETE" });
      setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((c) => Math.max(0, c - 1));
    } catch {}
  }

  return (
    <View className="bg-white rounded-xl overflow-hidden border border-slate-200" style={{ elevation: 1 }}>
      {/* Header */}
      <TouchableOpacity
        className="flex-row items-center gap-3 px-4 py-3"
        onPress={() => router.push(`/profile/${profilePhone}`)}
        activeOpacity={0.7}
      >
        <Avatar src={post.author.avatarUrl} name={authorName} size={36} />
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Text className="font-heebo-bold text-sm text-slate-900">{authorName}</Text>
            {post.author.isVerified && <VerifiedBadge size={14} />}
          </View>
          {post.author.company && (
            <Text className="text-xs text-slate-400" numberOfLines={1}>{post.author.company}</Text>
          )}
        </View>
        <Text className="text-xs text-slate-400">{timeAgo(post.createdAt)}</Text>
        {isOwner && (
          <TouchableOpacity onPress={handleDelete} disabled={deleting} className="p-1">
            {deleting ? (
              <ActivityIndicator size="small" color="#94a3b8" />
            ) : (
              <Ionicons name="trash-outline" size={16} color="#94a3b8" />
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Content */}
      <Pressable onPress={handleDoubleTap}>
        {hasImage && (
          <View style={{ aspectRatio: 4 / 5 }} className="bg-slate-100 relative">
            <Image
              source={{ uri: post.backgroundImageUrl! }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={300}
            />
            <Animated.View
              style={[heartStyle, { position: "absolute", top: "50%", left: "50%", marginLeft: -40, marginTop: -40 }]}
              pointerEvents="none"
            >
              <Ionicons name="heart" size={80} color="#ef4444" />
            </Animated.View>
          </View>
        )}

        {hasGradient && (
          <View style={{ aspectRatio: 1 }} className="relative">
            <LinearGradient
              colors={bg.colors as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}
            >
              {bg.emoji && <EmojiOverlay emoji={bg.emoji} />}
              <Text className="text-white text-xl font-heebo-bold text-center leading-8" style={{ zIndex: 10 }}>
                {post.content}
              </Text>
            </LinearGradient>
            <Animated.View
              style={[heartStyle, { position: "absolute", top: "50%", left: "50%", marginLeft: -40, marginTop: -40 }]}
              pointerEvents="none"
            >
              <Ionicons name="heart" size={80} color="#ef4444" />
            </Animated.View>
          </View>
        )}

        {(hasImage || (!hasImage && !hasGradient)) && (
          <View className="px-4 py-3">
            <Text className="text-sm text-slate-800 leading-6">
              {hasImage && <Text className="font-heebo-bold text-slate-900">{authorName} </Text>}
              {post.content}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Actions */}
      <View className="px-4 py-3 border-t border-slate-100 flex-row items-center gap-5">
        <TouchableOpacity onPress={handleLike} className="flex-row items-center gap-1.5">
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={22}
            color={liked ? "#ef4444" : "#64748b"}
          />
          {likesCount > 0 && (
            <Text className={`text-sm font-heebo-medium ${liked ? "text-red-500" : "text-slate-500"}`}>
              {likesCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowComments((v) => !v)}
          className="flex-row items-center gap-1.5"
        >
          <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
          {commentsCount > 0 && (
            <Text className="text-sm font-heebo-medium text-slate-500">{commentsCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Comments */}
      {showComments && (
        <View className="px-4 pb-3 border-t border-slate-100">
          <View className="flex-row items-center gap-2 pt-2">
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="הוסף תגובה..."
              placeholderTextColor="#94a3b8"
              className="flex-1 bg-slate-50 rounded-full px-4 py-2 text-sm text-slate-900"
              style={{ textAlign: "right" }}
              onSubmitEditing={handleAddComment}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!commentText.trim() || submittingComment}
              className="p-2"
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#10b981" />
              ) : (
                <Ionicons name="send" size={18} color={commentText.trim() ? "#10b981" : "#cbd5e1"} />
              )}
            </TouchableOpacity>
          </View>

          {localComments.map((c) => {
            const cName = `${c.author.firstName} ${c.author.lastName}`;
            const canDelete = c.author.id === sessionUserId || isOwner;
            return (
              <View key={c.id} className="flex-row gap-2 mt-2">
                <Avatar src={c.author.avatarUrl} name={cName} size={28} />
                <View className="flex-1">
                  <View className="bg-slate-50 rounded-xl px-3 py-1.5">
                    <View className="flex-row items-center gap-1">
                      <Text className="text-xs font-heebo-bold text-slate-900">{cName}</Text>
                      {c.author.isVerified && <VerifiedBadge size={12} />}
                    </View>
                    <Text className="text-sm text-slate-700">{c.content}</Text>
                  </View>
                  <View className="flex-row items-center gap-2 mt-0.5 px-1">
                    <Text className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</Text>
                    {canDelete && (
                      <TouchableOpacity onPress={() => handleDeleteComment(c.id)}>
                        <Text className="text-[10px] text-slate-400">מחק</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
