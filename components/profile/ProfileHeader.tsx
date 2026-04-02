import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui/Avatar";
import { VerifiedBadge } from "../ui/VerifiedBadge";
import type { ProfileData } from "../../lib/types";

interface ProfileHeaderProps {
  profile: ProfileData;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwner: boolean;
  onFollow?: () => void;
  followLoading?: boolean;
  onEditProfile?: () => void;
}

export function ProfileHeader({
  profile, followersCount, followingCount,
  isFollowing, isOwner, onFollow, followLoading, onEditProfile,
}: ProfileHeaderProps) {
  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <View>
      {/* Cover */}
      <View className="h-36 bg-slate-200">
        {profile.coverUrl ? (
          <Image source={{ uri: profile.coverUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <View className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600" />
        )}
      </View>

      <View className="px-4 -mt-12">
        {/* Avatar */}
        <View className="flex-row items-end justify-between">
          <View className="rounded-full border-4 border-white overflow-hidden">
            <Avatar src={profile.avatarUrl} name={fullName} size={80} />
          </View>
          {isOwner ? (
            <TouchableOpacity
              onPress={onEditProfile}
              className="bg-white border border-slate-200 rounded-lg px-4 py-2 flex-row items-center gap-1.5 mb-1"
            >
              <Ionicons name="pencil" size={14} color="#64748b" />
              <Text className="text-sm font-heebo-medium text-slate-700">ערוך פרופיל</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onFollow}
              disabled={followLoading}
              className={`rounded-lg px-5 py-2 mb-1 ${isFollowing ? "bg-slate-100" : "bg-emerald-500"}`}
            >
              <Text className={`text-sm font-heebo-bold ${isFollowing ? "text-slate-600" : "text-white"}`}>
                {isFollowing ? "עוקב ✓" : "עקוב"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Name & info */}
        <View className="mt-3">
          <View className="flex-row items-center gap-1">
            <Text className="text-lg font-heebo-bold text-slate-900">{fullName}</Text>
            {profile.isVerified && <VerifiedBadge size={18} />}
          </View>
          {profile.rank && (
            <Text className="text-sm text-slate-500">{profile.rank}</Text>
          )}
          {profile.bio && (
            <Text className="text-sm text-slate-700 mt-1 leading-5">{profile.bio}</Text>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row gap-6 mt-4 pb-4 border-b border-slate-100">
          <View className="items-center">
            <Text className="text-base font-heebo-bold text-slate-900">{followersCount}</Text>
            <Text className="text-xs text-slate-400">עוקבים</Text>
          </View>
          <View className="items-center">
            <Text className="text-base font-heebo-bold text-slate-900">{followingCount}</Text>
            <Text className="text-xs text-slate-400">עוקב</Text>
          </View>
          {profile.profileViews > 0 && (
            <View className="items-center">
              <Text className="text-base font-heebo-bold text-slate-900">{profile.profileViews}</Text>
              <Text className="text-xs text-slate-400">צפיות</Text>
            </View>
          )}
        </View>

        {/* Details */}
        {(profile.occupation || profile.workplace || profile.hobbies || profile.relationshipStatus) && (
          <View className="py-3 gap-2 border-b border-slate-100">
            {profile.occupation && (
              <View className="flex-row items-center gap-2">
                <Ionicons name="briefcase-outline" size={14} color="#94a3b8" />
                <Text className="text-sm text-slate-600">{profile.occupation}</Text>
              </View>
            )}
            {profile.workplace && (
              <View className="flex-row items-center gap-2">
                <Ionicons name="business-outline" size={14} color="#94a3b8" />
                <Text className="text-sm text-slate-600">{profile.workplace}</Text>
              </View>
            )}
            {profile.hobbies && (
              <View className="flex-row items-center gap-2">
                <Ionicons name="heart-outline" size={14} color="#94a3b8" />
                <Text className="text-sm text-slate-600">{profile.hobbies}</Text>
              </View>
            )}
            {profile.relationshipStatus && (
              <View className="flex-row items-center gap-2">
                <Ionicons name="people-outline" size={14} color="#94a3b8" />
                <Text className="text-sm text-slate-600">{profile.relationshipStatus}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
