import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Avatar } from "../ui/Avatar";
import { VerifiedBadge } from "../ui/VerifiedBadge";
import { getPostBackground, EMOJI_POSITIONS } from "../../lib/postBackgrounds";
import { timeAgo } from "../../lib/timeAgo";
import { api } from "../../lib/api";
import { hebrewTextInput } from "../../lib/hebrewInputStyle";
import { rowRtl } from "../../lib/rowRtl";
import type { PostData, PostComment } from "../../lib/types";

interface PostCardProps {
  post: PostData;
  isOwner: boolean;
  sessionUserId: string;
  onDelete: (id: string) => void;
}

function IndeterminateUploadStripe() {
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);
  const stripeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View className="h-full w-full bg-emerald-500" style={stripeStyle} />;
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

const SCREEN_H = Dimensions.get("window").height;

export function PostCard({ post, isOwner, sessionUserId, onDelete }: PostCardProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [deleting, setDeleting] = useState(false);
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localComments, setLocalComments] = useState<PostComment[]>(post.recentComments ?? []);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [likeSubmitting, setLikeSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const lastTapRef = useRef(0);
  const likingRef = useRef(false);
  const skipToolbarBurstRef = useRef(false);

  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const heartTranslateY = useSharedValue(0);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: heartTranslateY.value }, { scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  /** אפקט לב קטן מעל כפתור הלייק (עולה ונעלם) */
  const toolbarBurstY = useSharedValue(0);
  const toolbarBurstOpacity = useSharedValue(0);
  const toolbarBurstScale = useSharedValue(0.75);

  const toolbarBurstStyle = useAnimatedStyle(() => ({
    opacity: toolbarBurstOpacity.value,
    transform: [{ translateY: toolbarBurstY.value }, { scale: toolbarBurstScale.value }],
  }));

  const commentsBackdropOpacity = useSharedValue(0);
  const commentsSheetTranslateY = useSharedValue(SCREEN_H);

  const commentsBackdropStyle = useAnimatedStyle(() => ({
    opacity: commentsBackdropOpacity.value,
  }));

  const commentsSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: commentsSheetTranslateY.value }],
  }));

  const closeCommentsModal = useCallback(() => {
    commentsBackdropOpacity.value = withTiming(0, { duration: 200 });
    commentsSheetTranslateY.value = withTiming(
      SCREEN_H,
      { duration: 280, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setShowComments)(false);
      }
    );
  }, []);

  function playToolbarLikeBurst() {
    toolbarBurstY.value = 0;
    toolbarBurstOpacity.value = 1;
    toolbarBurstScale.value = 0.75;
    toolbarBurstY.value = withSequence(
      withTiming(-40, { duration: 380, easing: Easing.out(Easing.cubic) }),
      withTiming(-52, { duration: 200 })
    );
    toolbarBurstOpacity.value = withSequence(
      withDelay(80, withTiming(1, { duration: 120 })),
      withDelay(220, withTiming(0, { duration: 480 }))
    );
    toolbarBurstScale.value = withSequence(
      withTiming(1.2, { duration: 240 }),
      withDelay(100, withTiming(0.85, { duration: 400 }))
    );
  }

  const bg = getPostBackground(post.backgroundStyle);
  const hasImage = !!post.backgroundImageUrl;
  const hasGradient = !!bg && !hasImage;
  const authorName = `${post.author.firstName} ${post.author.lastName}`;
  const phone = post.author.phone?.replace(/\D/g, "");
  const profilePhone = phone?.length >= 10 ? phone.slice(-10) : phone?.length >= 9 ? `0${phone.slice(-9)}` : phone;

  const handleLike = useCallback(async () => {
    if (post.isUploading) {
      skipToolbarBurstRef.current = false;
      return;
    }
    if (likingRef.current) {
      skipToolbarBurstRef.current = false;
      return;
    }
    likingRef.current = true;
    setLikeSubmitting(true);
    const optimistic = !liked;
    if (!liked && !skipToolbarBurstRef.current) {
      playToolbarLikeBurst();
    }
    skipToolbarBurstRef.current = false;
    setLiked(optimistic);
    setLikesCount((c) => c + (optimistic ? 1 : -1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await api<{ liked: boolean; likesCount: number }>(`/posts/${post.id}/like`, { method: "POST" });
      setLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch {
      setLiked(!optimistic);
      setLikesCount((c) => c + (optimistic ? -1 : 1));
    } finally {
      setLikeSubmitting(false);
      likingRef.current = false;
    }
  }, [liked, post.id, post.isUploading]);

  const handleDoubleTap = useCallback(() => {
    if (post.isUploading) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      heartTranslateY.value = 0;
      heartTranslateY.value = withSequence(
        withTiming(-40, { duration: 420, easing: Easing.out(Easing.cubic) }),
        withDelay(280, withTiming(0, { duration: 0 }))
      );
      heartScale.value = withSequence(
        withTiming(1.25, { duration: 220 }),
        withDelay(280, withTiming(0, { duration: 220 }))
      );
      heartOpacity.value = withSequence(
        withTiming(1, { duration: 120 }),
        withDelay(300, withTiming(0, { duration: 380 }))
      );
      if (!liked) {
        skipToolbarBurstRef.current = true;
        handleLike();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    lastTapRef.current = now;
  }, [liked, handleLike, heartScale, heartOpacity, heartTranslateY, post.isUploading]);

  function handleDelete() {
    if (post.id.startsWith("temp-")) {
      onDelete(post.id);
      return;
    }
    setDeleteConfirmVisible(true);
  }

  async function confirmDeletePost() {
    setDeleteConfirmVisible(false);
    setDeleting(true);
    try {
      await api(`/posts/${post.id}`, { method: "DELETE" });
      onDelete(post.id);
    } catch {
      /* שקט — אפשר להוסיף טוסט */
    }
    setDeleting(false);
  }

  async function handleAddComment() {
    if (post.isUploading || !commentText.trim() || submittingComment) return;
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
    setDeletingCommentId(commentId);
    try {
      await api(`/posts/${post.id}/comments/${commentId}`, { method: "DELETE" });
      setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((c) => Math.max(0, c - 1));
    } catch {}
    setDeletingCommentId(null);
  }

  useEffect(() => {
    if (!showComments) return;
    commentsBackdropOpacity.value = 0;
    commentsSheetTranslateY.value = SCREEN_H;
    const frame = requestAnimationFrame(() => {
      commentsBackdropOpacity.value = withTiming(0.45, { duration: 220 });
      commentsSheetTranslateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [showComments]);

  useEffect(() => {
    if (!showComments) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await api<PostComment[] | { comments: PostComment[] }>(`/posts/${post.id}/comments`);
        const arr = Array.isArray(res) ? res : res.comments;
        if (!cancelled && Array.isArray(arr) && arr.length > 0) {
          setLocalComments(arr);
        }
      } catch {
        /* נשארים עם recentComments מהפוסט */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showComments, post.id]);

  return (
    <View className="bg-white rounded-xl overflow-hidden border border-slate-200" style={{ elevation: 1 }}>
      {post.isUploading ? (
        <View className="h-[3px] w-full bg-slate-200 overflow-hidden">
          {typeof post.uploadProgress === "number" ? (
            <View
              className="h-full bg-emerald-500 rounded-e-sm"
              style={{ width: `${Math.min(100, Math.max(0, post.uploadProgress))}%` }}
            />
          ) : (
            <View className="h-full w-full">
              <IndeterminateUploadStripe />
            </View>
          )}
        </View>
      ) : null}
      {/* Header */}
      <TouchableOpacity
        className={`${rowRtl()} items-center gap-3 px-4 py-3`}
        onPress={() => router.push(`/profile/${profilePhone}`)}
        activeOpacity={0.7}
      >
        <Avatar src={post.author.avatarUrl} name={authorName} size={36} />
        <View className="flex-1 min-w-0 self-stretch">
          <View className={`${rowRtl()} items-center gap-1`}>
            <Text
              className="font-heebo-bold text-sm text-slate-900"
              style={{ writingDirection: "rtl", textAlign: "right" }}
            >
              {authorName}
            </Text>
            {post.author.isVerified && <VerifiedBadge size={14} />}
          </View>
          {post.author.company && (
            <Text
              className="text-xs text-slate-400 mt-0.5"
              style={{ writingDirection: "rtl", textAlign: "right" }}
              numberOfLines={1}
            >
              {post.author.company}
            </Text>
          )}
        </View>
        <Text className="text-xs text-slate-400">{timeAgo(post.createdAt)}</Text>
        {isOwner && (
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleting}
            className="p-1.5 -m-0.5"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
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
            <Text className="text-sm text-slate-800 leading-6 text-start" style={{ writingDirection: "rtl" }}>
              {hasImage && <Text className="font-heebo-bold text-slate-900">{authorName} </Text>}
              {post.content}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Actions */}
      <View className={`px-4 py-3 border-t border-slate-100 ${rowRtl()} items-center gap-5 ${post.isUploading ? "opacity-50" : ""}`}>
        <View className="relative justify-center" style={{ overflow: "visible", minWidth: 52 }}>
          <TouchableOpacity
            onPress={handleLike}
            disabled={!!post.isUploading || likeSubmitting}
            className={`${rowRtl()} items-center gap-1.5 min-w-[48px]`}
          >
            {likeSubmitting ? (
              <ActivityIndicator size="small" color={liked ? "#ef4444" : "#64748b"} />
            ) : (
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={22}
                color={liked ? "#ef4444" : "#64748b"}
              />
            )}
            {likesCount > 0 && (
              <Text className={`text-sm font-heebo-medium ${liked ? "text-red-500" : "text-slate-500"}`}>
                {likesCount}
              </Text>
            )}
          </TouchableOpacity>
          <Animated.View
            pointerEvents="none"
            style={[
              toolbarBurstStyle,
              {
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 40,
                alignItems: "center",
              },
            ]}
          >
            <Ionicons name="heart" size={28} color="#ef4444" />
          </Animated.View>
        </View>

        <TouchableOpacity
          onPress={() => !post.isUploading && setShowComments(true)}
          disabled={!!post.isUploading}
          className={`${rowRtl()} items-center gap-1.5`}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
          {commentsCount > 0 && (
            <Text className="text-sm font-heebo-medium text-slate-500">{commentsCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showComments}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeCommentsModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          <View style={{ flex: 1 }}>
            <Animated.View
              pointerEvents="box-none"
              style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000" }, commentsBackdropStyle]}
            >
              <Pressable style={StyleSheet.absoluteFillObject} onPress={closeCommentsModal} />
            </Animated.View>
            <Animated.View
              style={[
                {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  maxHeight: SCREEN_H * 0.82,
                  paddingBottom: Math.max(insets.bottom, 10),
                },
                commentsSheetStyle,
              ]}
            >
              <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-3 mb-1" />
              <View className={`${rowRtl()} items-center justify-between px-4 py-2 border-b border-slate-100`}>
                <TouchableOpacity
                  onPress={closeCommentsModal}
                  className="py-2 px-1 min-w-[56px]"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-emerald-600 font-heebo-bold text-sm" style={{ writingDirection: "rtl" }}>
                    סגור
                  </Text>
                </TouchableOpacity>
                <Text className="text-base font-heebo-bold text-slate-900" style={{ writingDirection: "rtl" }}>
                  תגובות{commentsCount > 0 ? ` · ${commentsCount}` : ""}
                </Text>
                <View className="min-w-[56px]" />
              </View>

              <ScrollView
                style={{ maxHeight: SCREEN_H * 0.44 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {localComments.length === 0 ? (
                  <Text className="text-sm text-slate-400 text-center py-6" style={{ writingDirection: "rtl" }}>
                    אין עדיין תגובות — היו הראשונים
                  </Text>
                ) : (
                  localComments.map((c) => {
                    const cName = `${c.author.firstName} ${c.author.lastName}`;
                    const canDelete = c.author.id === sessionUserId || isOwner;
                    return (
                      <View key={c.id} className={`${rowRtl()} items-start gap-3 mb-4`}>
                        <Avatar src={c.author.avatarUrl} name={cName} size={36} noImageFade />
                        <View className="flex-1 min-w-0">
                          <View className="bg-slate-50 rounded-2xl px-3.5 py-2.5">
                            <View className={`${rowRtl()} items-center gap-1.5 mb-1`}>
                              <Text
                                className="text-xs font-heebo-bold text-slate-900"
                                style={{ writingDirection: "rtl", textAlign: "right" }}
                                numberOfLines={1}
                              >
                                {cName}
                              </Text>
                              {c.author.isVerified && <VerifiedBadge size={12} />}
                            </View>
                            <Text
                              className="text-sm text-slate-700 leading-5"
                              style={{ writingDirection: "rtl", textAlign: "right" }}
                            >
                              {c.content}
                            </Text>
                          </View>
                          <View className={`${rowRtl()} items-center gap-3 mt-2 ps-0.5`}>
                            <Text className="text-[11px] text-slate-400">{timeAgo(c.createdAt)}</Text>
                            {canDelete ? (
                              <TouchableOpacity
                                onPress={() => handleDeleteComment(c.id)}
                                disabled={deletingCommentId === c.id}
                                className="p-1 min-w-[28px] min-h-[28px] items-center justify-center"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                accessibilityLabel="מחק תגובה"
                              >
                                {deletingCommentId === c.id ? (
                                  <ActivityIndicator size="small" color="#ef4444" />
                                ) : (
                                  <Ionicons name="trash-outline" size={15} color="#ef4444" />
                                )}
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <View className="border-t border-slate-100 px-4 pt-3 mt-1">
                <View className={`${rowRtl()} items-center gap-2.5`}>
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="הוסף תגובה..."
                    placeholderTextColor="#94a3b8"
                    className="flex-1 bg-slate-50 rounded-full px-4 py-2.5 text-sm text-slate-900 min-h-[44px]"
                    style={hebrewTextInput}
                    onSubmitEditing={handleAddComment}
                    returnKeyType="send"
                  />
                  <TouchableOpacity
                    onPress={handleAddComment}
                    disabled={!commentText.trim() || submittingComment}
                    className="p-2.5 rounded-full bg-slate-50"
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    {submittingComment ? (
                      <ActivityIndicator size="small" color="#10b981" />
                    ) : (
                      <Ionicons name="send" size={18} color={commentText.trim() ? "#10b981" : "#cbd5e1"} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View className="flex-1 justify-center items-center px-6">
          <Pressable
            style={StyleSheet.absoluteFillObject}
            className="bg-black/50"
            onPress={() => setDeleteConfirmVisible(false)}
            accessibilityLabel="סגור"
          />
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 340,
              overflow: "hidden",
              zIndex: 1,
              elevation: 6,
            }}
          >
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
              <Text
                style={{
                  fontFamily: "Heebo_700Bold",
                  fontSize: 18,
                  color: "#0f172a",
                  textAlign: "right",
                  writingDirection: "rtl",
                }}
              >
                מחיקת פוסט
              </Text>
              <Text
                style={{
                  fontFamily: "Heebo",
                  fontSize: 14,
                  color: "#475569",
                  marginTop: 8,
                  lineHeight: 20,
                  textAlign: "right",
                  writingDirection: "rtl",
                }}
              >
                בטוח שברצונך למחוק את הפוסט?
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row-reverse",
                paddingHorizontal: 16,
                paddingVertical: 16,
                gap: 12,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: "#f1f5f9",
              }}
            >
              <TouchableOpacity
                onPress={() => setDeleteConfirmVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: "#f1f5f9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                accessibilityRole="button"
                accessibilityLabel="ביטול"
              >
                <Text style={{ fontFamily: "Heebo_700Bold", color: "#334155", writingDirection: "rtl" }}>
                  ביטול
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeletePost}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: "#ef4444",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                accessibilityRole="button"
                accessibilityLabel="מחק פוסט"
              >
                <Text style={{ fontFamily: "Heebo_700Bold", color: "#fff", writingDirection: "rtl" }}>
                  מחק
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
