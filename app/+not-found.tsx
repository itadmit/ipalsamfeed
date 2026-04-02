import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Ionicons name="alert-circle-outline" size={64} color="#cbd5e1" />
      <Text className="text-lg font-heebo-bold text-slate-900 mt-4">העמוד לא נמצא</Text>
      <TouchableOpacity
        onPress={() => router.replace("/(tabs)/feed")}
        className="mt-6 bg-emerald-500 rounded-xl px-6 py-3"
      >
        <Text className="text-white font-heebo-bold">חזור לפיד</Text>
      </TouchableOpacity>
    </View>
  );
}
