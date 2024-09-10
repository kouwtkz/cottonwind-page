import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import { EnvAtom } from "@/state/EnvState";
import { postsDataAtom } from "./DataState";

export const postsAtom = atom<PostType[]>();
export const postsMapAtom = atom<Map<string, PostType>>();

export default function PostState() {
  const postsData = useAtom(postsDataAtom)[0];
  const setPosts = useAtom(postsAtom)[1];
  const setPostsMap = useAtom(postsMapAtom)[1];
  const env = useAtom(EnvAtom)[0];
  useEffect(() => {
    if (postsData && env) {
      const postsMap = new Map<string, PostType>();
      postsData.forEach((v) => {
        const item: PostType = {
          ...v,
          category: v.category ? v.category.split(",") : [],
          draft: typeof v.draft === "number" ? Boolean(v.draft) : undefined,
          noindex:
            typeof v.noindex === "number" ? Boolean(v.noindex) : undefined,
          time: v.time ? new Date(v.time) : undefined,
          lastmod: v.lastmod ? new Date(v.lastmod) : undefined,
        };
        const key = item.postId;
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
