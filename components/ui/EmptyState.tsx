import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-20 px-4">
      <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
        <Ionicons name={icon} size={32} color="#cbd5e1" />
      </View>
      <Text className="text-base font-heebo-bold text-slate-700 mb-1 text-center">{title}</Text>
      {subtitle && (
        <Text className="text-sm text-slate-400 text-center">{subtitle}</Text>
      )}
    </View>
  );
}
