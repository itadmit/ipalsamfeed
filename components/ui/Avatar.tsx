import { View, Text } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

interface AvatarProps {
  src: string | null | undefined;
  name: string;
  size?: number;
}

export function Avatar({ src, name, size = 36 }: AvatarProps) {
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-emerald-500 items-center justify-center"
    >
      {initials ? (
        <Text
          style={{ fontSize: size * 0.38, lineHeight: size * 0.45 }}
          className="text-white font-heebo-bold"
        >
          {initials}
        </Text>
      ) : (
        <Ionicons name="person" size={size * 0.5} color="white" />
      )}
    </View>
  );
}
