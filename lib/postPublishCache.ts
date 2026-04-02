import type { PostData, PostPublishEvent } from "./types";

export function applyPublishEventToProfilePosts(
  posts: PostData[],
  e: PostPublishEvent
): PostData[] {
  switch (e.type) {
    case "optimistic":
      return [e.post, ...posts];
    case "progress":
      return posts.map((p) =>
        p.id === e.tempId ? { ...p, isUploading: true, uploadProgress: e.percent } : p
      );
    case "done": {
      const next = { ...e.post, isUploading: false, uploadProgress: undefined };
      return posts.map((p) => (p.id === e.tempId ? next : p));
    }
    case "error":
      return posts.filter((p) => p.id !== e.tempId);
    default:
      return posts;
  }
}

type FeedPages = { pages: Array<{ posts: PostData[]; hasMore: boolean }> };

export function applyPublishEventToFeedPages<T extends FeedPages>(
  old: T | undefined,
  e: PostPublishEvent
): T | undefined {
  if (!old) return old;
  switch (e.type) {
    case "optimistic":
      return {
        ...old,
        pages: old.pages.map((page, i) =>
          i === 0 ? { ...page, posts: [e.post, ...page.posts] } : page
        ),
      } as T;
    case "progress":
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: page.posts.map((p) =>
            p.id === e.tempId ? { ...p, isUploading: true, uploadProgress: e.percent } : p
          ),
        })),
      } as T;
    case "done": {
      const next = { ...e.post, isUploading: false, uploadProgress: undefined };
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: page.posts.map((p) => (p.id === e.tempId ? next : p)),
        })),
      } as T;
    }
    case "error":
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: page.posts.filter((p) => p.id !== e.tempId),
        })),
      } as T;
    default:
      return old;
  }
}
