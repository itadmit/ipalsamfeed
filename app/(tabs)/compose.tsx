import { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { CreatePostForm } from "../../components/posts/CreatePostForm";
import type { PostPublishEvent } from "../../lib/types";
import { applyPublishEventToFeedPages } from "../../lib/postPublishCache";

export default function ComposeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handlePublish = useCallback(
    (e: PostPublishEvent) => {
      (["all", "friends"] as const).forEach((mode) => {
        queryClient.setQueryData(["feed", mode], (old) =>
          applyPublishEventToFeedPages(old as Parameters<typeof applyPublishEventToFeedPages>[0], e)
        );
      });
      if (e.type === "done") {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    },
    [queryClient]
  );

  const close = useCallback(() => {
    router.push("/(tabs)/feed");
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <CreatePostForm variant="screen" onPublish={handlePublish} onRequestClose={close} />
    </SafeAreaView>
  );
}
