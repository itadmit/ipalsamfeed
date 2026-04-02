export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string;
  company?: string | null;
  isVerified?: boolean;
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
}

export interface PostData {
  id: string;
  authorId: string;
  content: string;
  backgroundImageUrl: string | null;
  backgroundStyle: string | null;
  createdAt: string;
  author: PostAuthor;
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  recentComments?: PostComment[];
}

export interface SuggestedUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string;
  rank: string | null;
  company: string | null;
}

export interface ExploreProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string;
  rank: string | null;
  company: string | null;
  isVerified?: boolean;
}

export interface ProfileNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export interface ProfileData {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  hobbies: string | null;
  workplace: string | null;
  occupation: string | null;
  relationshipStatus: string | null;
  rank: string | null;
  company: string | null;
  isVerified: boolean;
  profileViews: number;
  hidePhone: boolean;
  hideWhatsapp: boolean;
}

export interface ProfileResponse {
  profile: ProfileData;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwner: boolean;
  posts: PostData[];
}
