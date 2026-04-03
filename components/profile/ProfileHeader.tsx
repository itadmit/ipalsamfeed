import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../ui/Avatar";
import { VerifiedBadge } from "../ui/VerifiedBadge";
import type { ProfileData } from "../../lib/types";
import { rowRtl } from "../../lib/rowRtl";
import { relationshipStatusDisplay } from "../../lib/relationshipStatus";

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

function StatBlock({
  icon,
  value,
  label,
  showDivider,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  label: string;
  showDivider: boolean;
}) {
  return (
    <View
      className={`flex-1 min-w-0 ${showDivider ? "border-s border-slate-200/90" : ""}`}
      style={{ paddingVertical: 14 }}
    >
      <View className={`${rowRtl()} items-center justify-center gap-2 px-1`}>
        <Ionicons name={icon} size={22} color="#64748b" />
        <View className="items-center min-w-0">
          <Text
            className="text-base font-heebo-bold text-slate-900"
            numberOfLines={1}
            style={{ writingDirection: "rtl" }}
          >
            {value}
          </Text>
          <Text
            className="text-[11px] text-slate-500 font-heebo-medium mt-0.5"
            style={{ writingDirection: "rtl" }}
          >
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function ProfileHeader({
  profile, followersCount, followingCount,
  isFollowing, isOwner, onFollow, followLoading, onEditProfile,
}: ProfileHeaderProps) {
  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <View className="bg-white" style={{ direction: "rtl" }}>
      {/* Cover — גובה דומה ללינקדאין / פייסבוק */}
      <View className="w-full overflow-hidden bg-slate-200" style={{ height: 220 }}>
        {profile.coverUrl ? (
          <Image
            source={{ uri: profile.coverUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <LinearGradient
            colors={["#10b981", "#0d9488", "#0e7490"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: "100%", height: "100%" }}
          />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.22)"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 72,
          }}
          pointerEvents="none"
        />
      </View>

      <View className="px-4 -mt-[52px] pb-1">
        {/* Avatar + פעולות */}
        <View className={`${rowRtl()} items-end justify-between`}>
          <View
            className="rounded-full border-[3px] border-white overflow-hidden bg-white"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Avatar src={profile.avatarUrl} name={fullName} size={92} />
          </View>
          {isOwner ? (
            <TouchableOpacity
              onPress={onEditProfile}
              activeOpacity={0.85}
              className={`bg-white border border-slate-200 rounded-xl px-4 py-2.5 ${rowRtl()} items-center gap-2 mb-0.5`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <Ionicons name="create-outline" size={18} color="#475569" />
              <Text className="text-sm font-heebo-bold text-slate-700">ערוך פרופיל</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onFollow}
              disabled={followLoading}
              activeOpacity={0.85}
              className={`rounded-xl px-5 py-2 mt-3 min-h-[40px] min-w-[114px] ${rowRtl()} items-center justify-center gap-2 ${isFollowing ? "bg-slate-100 border border-slate-200" : "bg-emerald-500"}`}
              style={
                !isFollowing
                  ? {
                      shadowColor: "#059669",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: 2,
                    }
                  : undefined
              }
            >
              {followLoading ? (
                <>
                  <ActivityIndicator size="small" color={isFollowing ? "#475569" : "#ffffff"} />
                  <Text className={`text-[13px] font-heebo-bold ${isFollowing ? "text-slate-600" : "text-white"}`}>
                    רגע...
                  </Text>
                </>
              ) : (
                <>
                  {isFollowing ? (
                    <Ionicons name="person-remove-outline" size={18} color="#475569" />
                  ) : (
                    <Ionicons name="person-add-outline" size={18} color="#ffffff" />
                  )}
                  <Text className={`text-[13px] font-heebo-bold ${isFollowing ? "text-slate-700" : "text-white"}`}>
                    {isFollowing ? "הפסק לעקוב" : "עקוב"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* שם + אימות */}
        <View className="mt-4">
          <View className={`${rowRtl()} items-center gap-2 flex-wrap`}>
            <Text
              className="text-xl font-heebo-bold text-slate-900"
              style={{ writingDirection: "rtl", textAlign: "right" }}
            >
              {fullName}
            </Text>
            {profile.isVerified && <VerifiedBadge size={20} />}
          </View>
          {profile.rank ? (
            <Text
              className="text-sm text-slate-500 mt-1 leading-5"
              style={{ writingDirection: "rtl", textAlign: "right" }}
            >
              {profile.rank}
            </Text>
          ) : null}
          {profile.bio ? (
            <Text
              className="text-[15px] text-slate-700 mt-2.5 leading-6 w-full"
              style={{ writingDirection: "rtl", textAlign: "right" }}
            >
              {profile.bio}
            </Text>
          ) : null}
        </View>

        {/* סטטיסטיקות — רוחב מלא, אייקונים, קווי הפרדה */}
        <View
          className="mt-5 -mx-4 px-4"
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "rgba(226, 232, 240, 0.95)",
            backgroundColor: "rgba(248, 250, 252, 0.65)",
          }}
        >
          <View className={`${rowRtl()} w-full items-stretch`}>
            <StatBlock
              icon="people-outline"
              value={followersCount}
              label="עוקבים"
              showDivider
            />
            <StatBlock
              icon="person-outline"
              value={followingCount}
              label="עוקב"
              showDivider={profile.profileViews > 0}
            />
            {profile.profileViews > 0 ? (
              <StatBlock
                icon="eye-outline"
                value={profile.profileViews}
                label="צפיות"
                showDivider={false}
              />
            ) : null}
          </View>
        </View>

        {/* פרטים מקצועיים */}
        {(profile.occupation || profile.workplace || profile.hobbies || profile.relationshipStatus) && (
          <View className="pt-4 pb-4 gap-3 border-b border-slate-100">
            {profile.occupation && (
              <View className={`${rowRtl()} items-start gap-3`}>
                <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center">
                  <Ionicons name="briefcase-outline" size={18} color="#64748b" />
                </View>
                <Text
                  className="text-sm text-slate-700 flex-1 pt-1.5 leading-5"
                  style={{ writingDirection: "rtl", textAlign: "right" }}
                >
                  {profile.occupation}
                </Text>
              </View>
            )}
            {profile.workplace && (
              <View className={`${rowRtl()} items-start gap-3`}>
                <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center">
                  <Ionicons name="business-outline" size={18} color="#64748b" />
                </View>
                <Text
                  className="text-sm text-slate-700 flex-1 pt-1.5 leading-5"
                  style={{ writingDirection: "rtl", textAlign: "right" }}
                >
                  {profile.workplace}
                </Text>
              </View>
            )}
            {profile.hobbies && (
              <View className={`${rowRtl()} items-start gap-3`}>
                <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center">
                  <Ionicons name="heart-outline" size={18} color="#64748b" />
                </View>
                <Text
                  className="text-sm text-slate-700 flex-1 pt-1.5 leading-5"
                  style={{ writingDirection: "rtl", textAlign: "right" }}
                >
                  {profile.hobbies}
                </Text>
              </View>
            )}
            {profile.relationshipStatus && (
              <View className={`${rowRtl()} items-start gap-3`}>
                <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center">
                  <Ionicons name="people-outline" size={18} color="#64748b" />
                </View>
                <Text
                  className="text-sm text-slate-700 flex-1 pt-1.5 leading-5"
                  style={{ writingDirection: "rtl", textAlign: "right" }}
                >
                  {relationshipStatusDisplay(profile.relationshipStatus)}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
