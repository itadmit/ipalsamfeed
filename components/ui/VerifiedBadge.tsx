import { Ionicons } from "@expo/vector-icons";

interface VerifiedBadgeProps {
  size?: number;
}

export function VerifiedBadge({ size = 14 }: VerifiedBadgeProps) {
  return <Ionicons name="checkmark-circle" size={size} color="#3b82f6" />;
}
