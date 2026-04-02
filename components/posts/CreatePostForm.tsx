import { useState, useEffect, useRef } from "react";
import type { TextInput as TextInputType } from "react-native";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "../ui/Avatar";
import { POST_BACKGROUNDS, getPostBackground, EMOJI_POSITIONS } from "../../lib/postBackgrounds";
import { api, apiUploadWithProgress } from "../../lib/api";
import { hebrewTextInput } from "../../lib/hebrewInputStyle";
import { rowRtl, horizontalRowDirection } from "../../lib/rowRtl";
import { useAuthStore } from "../../lib/auth";
import type { PostData, PostAuthor, PostPublishEvent } from "../../lib/types";

interface CreatePostFormProps {
  onPublish: (e: PostPublishEvent) => void;
  /** card = שורה בפיד + מודל | screen = מסך מלא (טאב פרסום) */
  variant?: "card" | "screen";
  /** ב-variant screen — סגירה (חזרה לפיד) */
  onRequestClose?: () => void;
}

function EmojiOverlay({ emoji }: { emoji: string }) {
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }} pointerEvents="none">
      {EMOJI_POSITIONS.map(([top, left, rotation, scale], i) => (
        <Text
          key={i}
          style={{
            position: "absolute", top: `${top}%`, left: `${left}%`,
            transform: [{ rotate: `${rotation}deg` }, { scale }],
            fontSize: 22, opacity: 0.35,
          }}
        >
          {emoji}
        </Text>
      ))}
    </View>
  );
}

function makeTempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const WINDOW_H = Dimensions.get("window").height;
/** מודל מהפיד: גיליון תחתון ~חצי מסך (דומה ל־Facebook — composer קומפקטי + מקלדת) */
const CARD_MODAL_MAX_HEIGHT = Math.round(WINDOW_H * 0.52);

export function CreatePostForm({
  onPublish,
  variant = "card",
  onRequestClose,
}: CreatePostFormProps) {
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const isScreen = variant === "screen";
  /** מסך מלא בטאב vs מודל קומפקט מהפיד */
  const isCompactComposer = !isScreen;
  const textInputRef = useRef<TextInputType>(null);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [bgStyle, setBgStyle] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [showBgPicker, setShowBgPicker] = useState(false);

  if (!user) return null;
  const fullName = `${user.firstName} ${user.lastName}`;
  const selectedBg = getPostBackground(bgStyle);
  const canSubmit = !!(content.trim() || imageUri);
  const keyboardVerticalOffset = Platform.OS === "ios" ? Math.max(insets.top, 12) : 0;

  useEffect(() => {
    if (!isCompactComposer || !open) return;
    const t = setTimeout(() => textInputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [isCompactComposer, open]);

  function reset() {
    setContent("");
    setBgStyle(null);
    setImageUri(null);
    setImageMime("image/jpeg");
    setShowBgPicker(false);
    if (isScreen) {
      onRequestClose?.();
    } else {
      setOpen(false);
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 5],
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setImageUri(asset.uri);
    setImageMime(asset.mimeType || "image/jpeg");
    setBgStyle(null);
  }

  /** סוגר מקלדת ואז מריץ את הפעולה — מניעת לחיצה “בולעת” על ידי המקלדת */
  function dismissKeyboardThen(run: () => void) {
    Keyboard.dismiss();
    const delay = Platform.OS === "ios" ? 280 : 120;
    setTimeout(run, delay);
  }

  function handlePickImagePress() {
    dismissKeyboardThen(() => {
      void pickImage();
    });
  }

  function handleBgPickerPress() {
    if (imageUri) return;
    dismissKeyboardThen(() => {
      setShowBgPicker((v) => !v);
    });
  }

  function handleSubmit() {
    if (!user || !canSubmit) return;

    const buildAuthor = (): PostAuthor => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      isVerified: user.isVerified,
    });

    const snapshot = {
      content: content.trim(),
      imageUri,
      imageMime,
      bgStyle,
    };

    const tempId = makeTempId();
    const now = new Date().toISOString();
    const hasLocalImage = !!snapshot.imageUri;
    const optimistic: PostData = {
      id: tempId,
      authorId: user.id,
      content: snapshot.content,
      backgroundImageUrl: hasLocalImage ? snapshot.imageUri : null,
      backgroundStyle: hasLocalImage ? null : snapshot.bgStyle,
      createdAt: now,
      author: buildAuthor(),
      likesCount: 0,
      isLiked: false,
      commentsCount: 0,
      isUploading: true,
      uploadProgress: hasLocalImage ? 0 : null,
    };

    onPublish({ type: "optimistic", post: optimistic });
    reset();

    void (async () => {
      try {
        let backgroundImageUrl: string | null = null;

        if (snapshot.imageUri) {
          const formData = new FormData();
          formData.append("file", {
            uri: snapshot.imageUri,
            type: snapshot.imageMime,
            name: `post-${Date.now()}.jpg`,
          } as unknown as Blob);

          const up = await apiUploadWithProgress<{ url: string }>(
            "/posts/upload",
            formData,
            (p) => onPublish({ type: "progress", tempId, percent: p })
          );
          backgroundImageUrl = up.url;
        }

        onPublish({ type: "progress", tempId, percent: null });

        const res = await api<{ post: PostData }>("/posts", {
          method: "POST",
          body: {
            content: snapshot.content,
            backgroundImageUrl,
            backgroundStyle: backgroundImageUrl ? null : snapshot.bgStyle,
          },
        });

        onPublish({ type: "done", tempId, post: res.post });
      } catch {
        onPublish({ type: "error", tempId });
      }
    })();
  }

  if (!isScreen && !open) {
    return (
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className={`bg-white rounded-xl border border-slate-200 p-4 ${rowRtl()} items-center gap-3`}
        style={{ elevation: 1 }}
        activeOpacity={0.7}
      >
        <Avatar src={user.avatarUrl} name={fullName} size={36} />
        <Text
          className="flex-1 text-sm text-slate-400"
          style={{ writingDirection: "rtl", textAlign: "right" }}
        >
          מה חדש אצלך?
        </Text>
        <Ionicons name="add" size={22} color="#10b981" />
      </TouchableOpacity>
    );
  }

  /* ─── Screen variant (Facebook-style full composer) ─── */
  const screenComposer = (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Header: X (right) | title (center) | Post button (left) */}
        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: "#e2e8f0",
          }}
        >
          <TouchableOpacity
            onPress={reset}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="סגור"
          >
            <Ionicons name="close" size={26} color="#334155" />
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: "Heebo_700Bold",
              fontSize: 17,
              color: "#0f172a",
              writingDirection: "rtl",
            }}
          >
            יצירת פוסט
          </Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityLabel="פרסום"
            style={{
              paddingHorizontal: 18,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: canSubmit ? "#10b981" : "#e2e8f0",
            }}
            activeOpacity={0.85}
          >
            <Text
              style={{
                fontFamily: "Heebo_700Bold",
                fontSize: 14,
                color: canSubmit ? "#fff" : "#94a3b8",
                writingDirection: "rtl",
              }}
            >
              פרסום
            </Text>
          </TouchableOpacity>
        </View>

        {/* User info row */}
        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 6,
          }}
        >
          <Avatar src={user.avatarUrl} name={fullName} size={40} />
          <Text
            style={{
              fontFamily: "Heebo_700Bold",
              fontSize: 15,
              color: "#0f172a",
              writingDirection: "rtl",
              textAlign: "right",
            }}
            numberOfLines={1}
          >
            {fullName}
          </Text>
        </View>

        {/* Content area */}
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 12 }}
        >
          {imageUri ? (
            <View style={{ aspectRatio: 4 / 5 }} className="bg-slate-100 relative">
              <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                className="absolute top-2 start-2 bg-black/50 rounded-full p-1.5"
              >
                <Ionicons name="close" size={18} color="white" />
              </TouchableOpacity>
            </View>
          ) : null}

          {selectedBg && !imageUri ? (
            <View style={{ aspectRatio: 1 }} className="relative">
              <LinearGradient
                colors={selectedBg.colors as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
              >
                {selectedBg.emoji ? <EmojiOverlay emoji={selectedBg.emoji} /> : null}
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="כתבו משהו..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  multiline
                  className="text-white text-xl font-heebo-bold text-center w-full"
                  style={{ zIndex: 10, textAlign: "center" }}
                />
              </LinearGradient>
            </View>
          ) : !imageUri ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              <TextInput
                ref={textInputRef}
                value={content}
                onChangeText={setContent}
                placeholder="על מה תרצו לכתוב?"
                placeholderTextColor="#94a3b8"
                multiline
                style={[
                  hebrewTextInput,
                  {
                    fontFamily: "Heebo",
                    fontSize: 16,
                    color: "#1e293b",
                    minHeight: 160,
                    textAlignVertical: "top",
                  },
                ]}
                autoFocus
              />
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="הוסיפו כיתוב..."
                placeholderTextColor="#94a3b8"
                multiline
                style={[
                  hebrewTextInput,
                  {
                    fontFamily: "Heebo",
                    fontSize: 16,
                    color: "#1e293b",
                    minHeight: 100,
                    textAlignVertical: "top",
                  },
                ]}
              />
            </View>
          )}
        </ScrollView>

        {/* Bottom media toolbar */}
        <View
          style={{
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: "#e2e8f0",
            backgroundColor: "#fff",
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 8),
          }}
        >
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8, paddingBottom: 4 }}>
            <TouchableOpacity
              onPress={handlePickImagePress}
              activeOpacity={0.7}
              accessibilityLabel="העלאת תמונה"
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: "#f8fafc",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: "#e2e8f0",
              }}
            >
              <Ionicons name="image-outline" size={20} color="#059669" />
              <Text style={{ fontFamily: "Heebo_500Medium", fontSize: 12, color: "#475569", writingDirection: "rtl" }}>
                תמונה
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBgPickerPress}
              activeOpacity={0.7}
              disabled={!!imageUri}
              accessibilityLabel="בחירת רקע לפוסט"
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: imageUri ? "#f1f5f9" : showBgPicker ? "#ecfdf5" : "#f8fafc",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: imageUri ? "#e2e8f0" : showBgPicker ? "#6ee7b7" : "#e2e8f0",
                opacity: imageUri ? 0.55 : 1,
              }}
            >
              <Ionicons name="color-palette-outline" size={20} color={imageUri ? "#94a3b8" : "#059669"} />
              <Text
                style={{
                  fontFamily: "Heebo_500Medium",
                  fontSize: 12,
                  color: imageUri ? "#94a3b8" : "#475569",
                  writingDirection: "rtl",
                }}
              >
                רקע
              </Text>
            </TouchableOpacity>
          </View>

          {showBgPicker && !imageUri ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                flexDirection: horizontalRowDirection(),
                alignItems: "center",
                gap: 8,
                paddingVertical: 8,
                paddingHorizontal: 2,
              }}
            >
              <TouchableOpacity
                onPress={() => setBgStyle(null)}
                className={`w-8 h-8 rounded-full border-2 bg-white items-center justify-center ${!bgStyle ? "border-emerald-500" : "border-slate-200"}`}
              >
                <Ionicons name="close" size={14} color="#94a3b8" />
              </TouchableOpacity>
              {POST_BACKGROUNDS.map((bg) => (
                <TouchableOpacity key={bg.id} onPress={() => setBgStyle(bg.id)} activeOpacity={0.85}>
                  <LinearGradient
                    colors={bg.colors as [string, string, ...string[]]}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: bgStyle === bg.id ? 2 : 0,
                      borderColor: "#10b981",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {bg.pickerEmoji ? <Text style={{ fontSize: 13 }}>{bg.pickerEmoji}</Text> : null}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  /* ─── Card/compact variant (bottom-sheet from feed) ─── */
  const cardComposer = (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View className="flex-1 bg-white" style={{ minHeight: 0 }}>
        <View className={`${rowRtl()} items-center justify-between px-4 py-3 border-b border-slate-100`}>
          <View className={`${rowRtl()} items-center gap-2 flex-1 min-w-0`}>
            <Avatar src={user.avatarUrl} name={fullName} size={32} />
            <Text className="text-sm font-heebo-bold text-slate-900 flex-1" numberOfLines={1} style={{ writingDirection: "rtl", textAlign: "right" }}>
              {fullName}
            </Text>
          </View>
          <View className={`${rowRtl()} items-center gap-2 shrink-0`}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              accessibilityLabel="פרסום"
              className={`${rowRtl()} items-center gap-1.5 px-3 py-2 rounded-full ${canSubmit ? "bg-emerald-500" : "bg-emerald-200"}`}
              style={
                canSubmit
                  ? { shadowColor: "#059669", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }
                  : undefined
              }
              activeOpacity={0.85}
            >
              <Ionicons
                name="paper-plane"
                size={18}
                color={canSubmit ? "#ffffff" : "#94a3b8"}
                style={{ transform: [{ rotate: "-28deg" }] }}
              />
              <Text
                className={`text-xs font-heebo-bold ${canSubmit ? "text-white" : "text-slate-500"}`}
                style={{ writingDirection: "rtl" }}
              >
                פרסום
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={reset}
              className="p-1.5 rounded-full bg-slate-100"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 12 }}
        >
          {imageUri ? (
            <View style={{ height: 200, width: "100%" }} className="bg-slate-100 relative">
              <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                className="absolute top-2 start-2 bg-black/50 rounded-full p-1.5"
              >
                <Ionicons name="close" size={18} color="white" />
              </TouchableOpacity>
            </View>
          ) : null}

          {selectedBg && !imageUri ? (
            <View style={{ height: 200, width: "100%" }} className="relative">
              <LinearGradient
                colors={selectedBg.colors as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
              >
                {selectedBg.emoji ? <EmojiOverlay emoji={selectedBg.emoji} /> : null}
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="כתבו משהו..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  multiline
                  className="text-white text-xl font-heebo-bold text-center w-full"
                  style={{ zIndex: 10, textAlign: "center" }}
                />
              </LinearGradient>
            </View>
          ) : !imageUri ? (
            <View className="p-4">
              <TextInput
                ref={textInputRef}
                value={content}
                onChangeText={setContent}
                placeholder="כתבו משהו..."
                placeholderTextColor="#94a3b8"
                multiline
                className="text-base text-slate-800 min-h-[72px]"
                style={[hebrewTextInput, { textAlignVertical: "top" }]}
              />
            </View>
          ) : (
            <View className="p-4">
              <Text
                className="text-sm font-heebo-bold text-slate-600 mb-2.5"
                style={{ writingDirection: "rtl", textAlign: "right" }}
              >
                כיתוב לפוסט (אופציונלי)
              </Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="הוסף טקסט לפוסט..."
                placeholderTextColor="#94a3b8"
                multiline
                className="text-base text-slate-800 min-h-[100px]"
                style={[hebrewTextInput, { textAlignVertical: "top" }]}
              />
            </View>
          )}
        </ScrollView>

        <View
          className="border-t border-slate-200 bg-white px-3 pt-2"
          style={{ paddingBottom: Math.max(insets.bottom, 8) }}
        >
          <View className={`${rowRtl()} items-center pb-1 justify-center`} style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={handlePickImagePress}
              activeOpacity={0.85}
              accessibilityLabel="העלאת תמונה"
              className={`${rowRtl()} items-center gap-1.5 py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 shrink-0`}
              style={{ maxWidth: 168 }}
            >
              <Ionicons name="image-outline" size={18} color="#059669" />
              <Text className="text-[10px] font-heebo-medium text-slate-600" numberOfLines={2} style={{ writingDirection: "rtl", textAlign: "right" }}>
                העלאת תמונה
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBgPickerPress}
              activeOpacity={0.85}
              disabled={!!imageUri}
              accessibilityLabel="בחירת רקע לפוסט"
              className={`${rowRtl()} items-center gap-1.5 py-2 px-3 rounded-lg border shrink-0 ${
                imageUri
                  ? "bg-slate-100 border-slate-200 opacity-55"
                  : showBgPicker
                    ? "bg-emerald-50 border-emerald-300"
                    : "bg-slate-50 border-slate-200"
              }`}
              style={{ maxWidth: 168 }}
            >
              <Ionicons name="color-palette-outline" size={18} color={imageUri ? "#94a3b8" : "#059669"} />
              <Text
                className="text-[10px] font-heebo-medium"
                numberOfLines={2}
                style={{ writingDirection: "rtl", textAlign: "right", color: imageUri ? "#94a3b8" : "#475569" }}
              >
                בחירת רקע לפוסט
              </Text>
            </TouchableOpacity>
          </View>

          {showBgPicker && !imageUri ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              className="pb-1"
              contentContainerStyle={{
                flexDirection: horizontalRowDirection(),
                alignItems: "center",
                gap: 8,
                paddingVertical: 6,
                paddingHorizontal: 2,
              }}
            >
              <TouchableOpacity
                onPress={() => setBgStyle(null)}
                className={`w-8 h-8 rounded-full border-2 bg-white items-center justify-center ${!bgStyle ? "border-emerald-500" : "border-slate-200"}`}
              >
                <Ionicons name="close" size={14} color="#94a3b8" />
              </TouchableOpacity>
              {POST_BACKGROUNDS.map((bg) => (
                <TouchableOpacity key={bg.id} onPress={() => setBgStyle(bg.id)} activeOpacity={0.85}>
                  <LinearGradient
                    colors={bg.colors as [string, string, ...string[]]}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: bgStyle === bg.id ? 2 : 0,
                      borderColor: "#10b981",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {bg.pickerEmoji ? <Text style={{ fontSize: 13 }}>{bg.pickerEmoji}</Text> : null}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  if (isScreen) {
    return <View className="flex-1 bg-white">{screenComposer}</View>;
  }

  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={reset}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)" }]}
          onPress={reset}
          accessibilityLabel="סגור"
        />
        <View
          style={{
            maxHeight: CARD_MODAL_MAX_HEIGHT,
            width: "100%",
            backgroundColor: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: "hidden",
            ...(Platform.OS === "ios"
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.12,
                  shadowRadius: 10,
                }
              : { elevation: 18 }),
          }}
        >
          {cardComposer}
        </View>
      </View>
    </Modal>
  );
}
