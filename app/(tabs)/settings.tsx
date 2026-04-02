import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import { api, apiUpload } from "../../lib/api";
import { useAuthStore } from "../../lib/auth";
import { Avatar } from "../../components/ui/Avatar";

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const { data: fullProfile } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{
      hidePhone: boolean; hideWhatsapp: boolean; hideFromSearch: boolean;
      hobbies: string | null; workplace: string | null; occupation: string | null;
      relationshipStatus: string | null;
    }>("/auth/me"),
  });

  const [hidePhone, setHidePhone] = useState(fullProfile?.hidePhone ?? false);
  const [hideWhatsapp, setHideWhatsapp] = useState(fullProfile?.hideWhatsapp ?? false);
  const [hideFromSearch, setHideFromSearch] = useState(fullProfile?.hideFromSearch ?? false);
  const [hobbies, setHobbies] = useState(fullProfile?.hobbies ?? "");
  const [workplace, setWorkplace] = useState(fullProfile?.workplace ?? "");
  const [occupation, setOccupation] = useState(fullProfile?.occupation ?? "");
  const [relationshipStatus, setRelationshipStatus] = useState(fullProfile?.relationshipStatus ?? "");

  if (!user) return null;
  const fullName = `${user.firstName} ${user.lastName}`;

  async function handleSave() {
    setSaving(true);
    try {
      await api("/profile/update", {
        method: "PATCH",
        body: {
          bio: bio.trim(),
          hobbies: hobbies.trim() || null,
          workplace: workplace.trim() || null,
          occupation: occupation.trim() || null,
          relationshipStatus: relationshipStatus.trim() || null,
          hidePhone,
          hideWhatsapp,
          hideFromSearch,
        },
      });
      updateUser({ bio: bio.trim() });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      Alert.alert("נשמר", "הפרטים עודכנו בהצלחה");
    } catch {
      Alert.alert("שגיאה", "לא ניתן לשמור");
    }
    setSaving(false);
  }

  async function pickAndUpload(type: "avatar" | "cover") {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: type === "avatar" ? [1, 1] : [16, 9],
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const setter = type === "avatar" ? setUploadingAvatar : setUploadingCover;
    setter(true);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: `${type}-${Date.now()}.jpg`,
      } as unknown as Blob);
      formData.append("type", type);

      const res = await apiUpload<{ url: string }>("/profile/upload", formData);
      if (type === "avatar") {
        updateUser({ avatarUrl: res.url });
      } else {
        updateUser({ coverUrl: res.url });
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      Alert.alert("שגיאה", "העלאה נכשלה");
    }
    setter(false);
  }

  function handleLogout() {
    Alert.alert("התנתקות", "בטוח שרוצה להתנתק?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "התנתק", style: "destructive",
        onPress: () => {
          logout();
          queryClient.clear();
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-slate-100">
        <Text className="text-lg font-heebo-bold text-slate-900">הגדרות</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Photos */}
        <View className="items-center py-6 border-b border-slate-100">
          <TouchableOpacity onPress={() => pickAndUpload("avatar")} className="relative">
            <Avatar src={user.avatarUrl} name={fullName} size={80} />
            {uploadingAvatar ? (
              <View className="absolute inset-0 items-center justify-center bg-black/30 rounded-full">
                <ActivityIndicator color="white" />
              </View>
            ) : (
              <View className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1.5" style={{ elevation: 2 }}>
                <Ionicons name="camera" size={14} color="white" />
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-base font-heebo-bold text-slate-900 mt-2">{fullName}</Text>
          <Text className="text-sm text-slate-400">{user.phone}</Text>

          <TouchableOpacity
            onPress={() => pickAndUpload("cover")}
            className="mt-3 flex-row items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg"
          >
            {uploadingCover ? (
              <ActivityIndicator size="small" color="#64748b" />
            ) : (
              <>
                <Ionicons name="image-outline" size={16} color="#64748b" />
                <Text className="text-xs font-heebo-medium text-slate-600">שנה תמונת כיסוי</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Bio & Info */}
        <View className="px-4 py-4 gap-4">
          <Text className="text-sm font-heebo-bold text-slate-700">פרטים אישיים</Text>

          <View>
            <Text className="text-xs text-slate-500 mb-1">ביו</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="ספר/י משהו על עצמך..."
              placeholderTextColor="#94a3b8"
              multiline
              className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 border border-slate-200 min-h-[80px]"
              style={{ textAlign: "right", textAlignVertical: "top" }}
            />
          </View>

          <View>
            <Text className="text-xs text-slate-500 mb-1">מקצוע</Text>
            <TextInput
              value={occupation}
              onChangeText={setOccupation}
              placeholder="מה אתה עושה?"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 border border-slate-200"
              style={{ textAlign: "right" }}
            />
          </View>

          <View>
            <Text className="text-xs text-slate-500 mb-1">מקום עבודה</Text>
            <TextInput
              value={workplace}
              onChangeText={setWorkplace}
              placeholder="היכן אתה עובד?"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 border border-slate-200"
              style={{ textAlign: "right" }}
            />
          </View>

          <View>
            <Text className="text-xs text-slate-500 mb-1">תחביבים</Text>
            <TextInput
              value={hobbies}
              onChangeText={setHobbies}
              placeholder="תחביבים..."
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 border border-slate-200"
              style={{ textAlign: "right" }}
            />
          </View>

          <View>
            <Text className="text-xs text-slate-500 mb-1">סטטוס זוגי</Text>
            <TextInput
              value={relationshipStatus}
              onChangeText={setRelationshipStatus}
              placeholder="סטטוס..."
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 border border-slate-200"
              style={{ textAlign: "right" }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className={`rounded-xl py-3.5 items-center ${saving ? "bg-emerald-400" : "bg-emerald-500"}`}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-sm font-heebo-bold">שמור שינויים</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Privacy */}
        <View className="px-4 py-4 gap-3 border-t border-slate-100">
          <Text className="text-sm font-heebo-bold text-slate-700">פרטיות</Text>

          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-slate-600">הסתר מספר טלפון</Text>
            <Switch
              value={hidePhone}
              onValueChange={setHidePhone}
              trackColor={{ false: "#e2e8f0", true: "#6ee7b7" }}
              thumbColor={hidePhone ? "#10b981" : "#f4f4f5"}
            />
          </View>

          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-slate-600">הסתר וואטסאפ</Text>
            <Switch
              value={hideWhatsapp}
              onValueChange={setHideWhatsapp}
              trackColor={{ false: "#e2e8f0", true: "#6ee7b7" }}
              thumbColor={hideWhatsapp ? "#10b981" : "#f4f4f5"}
            />
          </View>

          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-slate-600">הסתר מחיפוש</Text>
            <Switch
              value={hideFromSearch}
              onValueChange={setHideFromSearch}
              trackColor={{ false: "#e2e8f0", true: "#6ee7b7" }}
              thumbColor={hideFromSearch ? "#10b981" : "#f4f4f5"}
            />
          </View>
        </View>

        {/* Logout */}
        <View className="px-4 py-6">
          <TouchableOpacity
            onPress={handleLogout}
            className="rounded-xl py-3.5 items-center bg-red-50 border border-red-200"
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
              <Text className="text-red-600 text-sm font-heebo-bold">התנתק</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
