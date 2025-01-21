import { useEffect } from "react";
import { useEnv } from "@/state/EnvState";
import { postsDataObject } from "./DataState";
import { CreateState } from "./CreateState";

export const usePosts = CreateState<PostType[]>();
export const usePostsMap = CreateState<Map<string, PostType>>();

export default function PostState() {
  const postsData = postsDataObject.useData()[0];
  const setPosts = usePosts()[1];
  const setPostsMap = usePostsMap()[1];
  const env = useEnv()[0];
  useEffect(() => {
    if (postsData && env) {
      const postsMap = new Map<string, PostType>();
      postsData.forEach((v) => {
        if (!v.body) return;
        const lastmod = v.lastmod ? new Date(v.lastmod) : undefined;
        const item: PostType = {
          ...v,
          category: v.category ? v.category.split(",") : [],
          draft: typeof v.draft === "number" ? Boolean(v.draft) : undefined,
          noindex:
            typeof v.noindex === "number" ? Boolean(v.noindex) : undefined,
          schedule: lastmod && lastmod.getTime() > Date.now(),
          time: v.time ? new Date(v.time) : undefined,
          lastmod: v.lastmod ? new Date(v.lastmod) : undefined,
        };
        const key = item.postId || "";
        if (!postsMap.has(key)) {
          postsMap.set(key, item);
        }
      });
      setPostsMap(postsMap);
      setPosts(Object.values(Object.fromEntries(postsMap)));
    }
  }, [postsData, env]);
  return <></>;
}
