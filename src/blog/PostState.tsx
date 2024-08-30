import { useEffect, useMemo, useRef } from "react";
import { create } from "zustand";
import axios from "axios";
import { useAtom } from "jotai";
import { ApiOriginAtom } from "@/state/EnvState";

function parsePosts(posts: Post[]) {
  posts.forEach((post) => {
    post.date = post.date ? new Date(post.date) : null;
    post.updatedAt = post.updatedAt ? new Date(post.updatedAt) : null;
  });
  return posts;
}
interface PostStateType {
  posts: Post[];
  url?: string;
  isSet: boolean;
  setPosts: (value: any, url?: string) => void;
  isReload: boolean;
  Reload: () => void;
}
export const usePostState = create<PostStateType>((set) => ({
  posts: [],
  isSet: false,
  setPosts(value, url) {
    set(() => ({
      posts: parsePosts(value),
      url,
      isSet: true,
      isReload: false,
    }));
  },
  isReload: true,
  Reload() {
    set(() => ({ isReload: true }));
  },
}));

export default function PostState({ url = "/blog/posts" }: { url?: string }) {
  const { setPosts, isReload } = usePostState();
  const [apiOrigin] = useAtom(ApiOriginAtom);
  const fetchUrl = useMemo(() => {
    if (url.startsWith("/")) {
      if (apiOrigin) return apiOrigin + url;
      else return;
    } else return url;
  }, [apiOrigin, url]);
  useEffect(() => {
    if (fetchUrl && isReload) {
      axios(fetchUrl, { withCredentials: true }).then((r) => {
        setPosts(r.data, url);
      });
    }
  }, [fetchUrl, isReload]);
  return <></>;
}
