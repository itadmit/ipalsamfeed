import { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Modal,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { Avatar } from "../ui/Avatar";
import { POST_BACKGROUNDS, getPostBackground, EMOJI_POSITIONS } from "../../lib/postBackgrounds";
import { api, apiUpload } from "../../lib/api";
import { useAuthStore } from "../../lib/auth";
import type { PostData } from "../../lib/types";

interface CreatePostFormProps {
  onCreated: (post: PostData) => void;
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

export function CreatePostForm({ onCreated }: CreatePostFormProps) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [bgStyle, setBgStyle] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);

  if (!user) return null;
  const fullName = `${user.firstName} ${user.lastName}`;
  const selectedBg = getPostBackground(bgStyle);

  function reset() {
    setContent("");
    setBgStyle(null);
    setImageUri(null);
    setImageUrl(null);
    setShowBgPicker(false);
    setOpen(false);
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
    setBgStyle(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: `post-${Date.now()}.jpg`,
      } as unknown as Blob);

      const res = await apiUpload<{ url: string }>("/posts/upload", formData);
      setImageUrl(res.url);
    } catch {
      setImageUri(null);
    }
    setUploading(false);
  }

  async function handleSubmit() {
    if (!content.trim() && !imageUrl) return;
    setSubmitting(true);
    try {
      const res = await api<{ post: PostData }>("/posts", {
        method: "POST",
        body: {
          content: content.trim(),
          backgroundImageUrl: imageUrl,
          backgroundStyle: !imageUrl ? bgStyle : null,
        },
      });
      onCreated(res.post);
      reset();
    } catch {}
    setSubmitting(false);
  }

  if (!open) {
    return (
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="bg-white rounded-xl border border-slate-200 p-4 flex-row items-center gap-3"
        style={{ elevation: 1 }}
        activeOpacity={0.7}
      >
        <Avatar src={user.avatarUrl} name={fullName} size={36} />
        <Text className="flex-1 text-sm text-slate-400">מה חדש אצלך?</Text>
        <Ionicons name="add" size={22} color="#10b981" />
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100">
          <View className="flex-row items-center gap-2">
            <Avatar src={user.avatarUrl} name={fullName} size={32} />
            <Text className="text-sm font-heebo-bold text-slate-900">{fullName}</Text>
          </View>
          <TouchableOpacity onPress={reset} className="p-1">
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {/* Image Preview */}
          {imageUri && (
            <View style={{ aspectRatio: 4 / 5 }} className="bg-slate-100 relative">
              <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              <TouchableOpacity
                onPress={() => { setImageUri(null); setImageUrl(null); }}
                className="absolute top-2 left-2 bg-black/50 rounded-full p-1.5"
              >
                <Ionicons name="close" size={18} color="white" />
              </TouchableOpacity>
              {uploading && (
                <View className="absolute inset-0 items-center justify-center bg-black/20">
                  <ActivityIndicator size="large" color="white" />
                </View>
              )}
            </View>
          )}

          {/* Background with text */}
          {selectedBg && !imageUri ? (
            <View style={{ aspectRatio: 1 }} className="relative">
              <LinearGradient
                colors={selectedBg.colors as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
              >
                {selectedBg.emoji && <EmojiOverlay emoji={selectedBg.emoji} />}
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
                value={content}
                onChangeText={setContent}
                placeholder="כתבו משהו..."
                placeholderTextColor="#94a3b8"
                multiline
                className="text-base text-slate-800 min-h-[100px]"
                style={{ textAlign: "right", textAlignVertical: "top" }}
                autoFocus
              />
            </View>
          ) : null}

          {/* Background Picker */}
          {showBgPicker && !imageUri && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-2">
              <TouchableOpacity
                onPress={() => setBgStyle(null)}
                className={`w-8 h-8 rounded-full border-2 bg-white items-center justify-center mr-2 ${!bgStyle ? "border-emerald-500" : "border-slate-200"}`}
              >
                <Ionicons name="close" size={14} color="#94a3b8" />
              </TouchableOpacity>
              {POST_BACKGROUNDS.map((bg) => (
                <TouchableOpacity
                  key={bg.id}
                  onPress={() => setBgStyle(bg.id)}
                  className="mr-2"
                >
                  <LinearGradient
                    colors={bg.colors as [string, string, ...string[]]}
                    style={{
                      width: 32, height: 32, borderRadius: 16,
                      borderWidth: bgStyle === bg.id ? 2 : 0,
                      borderColor: "white",
                      justifyContent: "center", alignItems: "center",
                    }}
                  >
                    {bg.pickerEmoji && <Text style={{ fontSize: 14 }}>{bg.pickerEmoji}</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </ScrollView>

        {/* Bottom bar */}
        <View className="px-4 py-3 border-t border-slate-100 flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={pickImage} disabled={uploading} className="items-center">
              {uploading ? (
                <ActivityIndicator size="small" color="#10b981" />
              ) : (
                <Ionicons name="image-outline" size={24} color="#64748b" />
              )}
              <Text className="text-[9px] text-slate-500 mt-0.5">תמונה</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowBgPicker((v) => !v)} className="items-center">
              <Ionicons name="color-palette-outline" size={24} color={showBgPicker ? "#10b981" : "#64748b"} />
              <Text className="text-[9px] text-slate-500 mt-0.5">רקע</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || (!content.trim() && !imageUrl)}
            className={`px-5 py-2 rounded-lg ${submitting || (!content.trim() && !imageUrl) ? "bg-emerald-300" : "bg-emerald-500"}`}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-sm font-heebo-bold">פרסם</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
