import { useEffect, useRef } from "react";
import { create } from "zustand";
import axios from "axios";
const defaultUrl = "/blog/posts.json";

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

export default function PostState({ url = defaultUrl }: { url?: string }) {
  const { setPosts, isReload } = usePostState();
  useEffect(() => {
    if (isReload) {
      axios(url).then((r) => {
        setPosts(r.data, url);
      });
    }
  }, [isReload]);
  return <></>;
}
