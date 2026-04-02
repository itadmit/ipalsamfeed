import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore, type User } from "../../lib/auth";
import { registerForPushNotifications } from "../../lib/notifications";
import { parseResponseJson } from "../../lib/api";
import { hebrewTextInput } from "../../lib/hebrewInputStyle";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://ipalsam.com";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleLogin() {
    if (!phone.trim() || !password.trim()) {
      setError("יש למלא טלפון וסיסמה");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/mobile/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });

      const data = await parseResponseJson<{
        error?: string;
        token?: string;
        user?: unknown;
      }>(res);

      if (!res.ok || data.error) {
        setError(data.error || "שגיאת התחברות");
        setLoading(false);
        return;
      }

      if (!data.token || !data.user) {
        setError("תגובת שרת לא צפויה");
        setLoading(false);
        return;
      }

      await setAuth(data.token, data.user as User);
      registerForPushNotifications().catch(() => {});
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "שגיאת חיבור לשרת";
      const network =
        msg.includes("Network request failed") ||
        msg.includes("Failed to fetch") ||
        msg.includes("internet connection");
      setError(
        network
          ? "אין חיבור לאינטרנט או שהשרת לא נגיש"
          : msg
      );
    }

    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-2xl bg-emerald-500 items-center justify-center mb-4">
              <Ionicons name="people" size={40} color="white" />
            </View>
            <Text className="text-2xl font-heebo-bold text-slate-900">iPalsam</Text>
            <Text className="text-sm text-slate-400 mt-1">הרשת החברתית הפנימית</Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="text-sm font-heebo-medium text-slate-700 mb-1.5 text-start">טלפון</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="050-1234567"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                className="bg-slate-50 rounded-xl px-4 py-3.5 text-base text-slate-900 border border-slate-200"
                style={{ textAlign: "left", writingDirection: "ltr" }}
              />
            </View>

            <View>
              <Text className="text-sm font-heebo-medium text-slate-700 mb-1.5 text-start">סיסמה</Text>
              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="הקלד סיסמה"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  className="bg-slate-50 rounded-xl px-4 py-3.5 text-base text-slate-900 border border-slate-200 pe-12"
                  style={hebrewTextInput}
                  onSubmitEditing={handleLogin}
                  returnKeyType="go"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  className="absolute end-3 top-0 bottom-0 justify-center"
                >
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View className="bg-red-50 rounded-xl px-4 py-3">
                <Text className="text-sm text-red-600 text-start">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`rounded-xl py-4 items-center ${loading ? "bg-emerald-400" : "bg-emerald-500"}`}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-heebo-bold">התחבר</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
