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
type PostStateType = {
  posts: Post[];
  isSet: boolean;
  url: string;
  setPosts: (value: any) => void;
  setUrl: (url?: string, setFlag?: boolean) => void;
  setPostsFromUrl: (url?: string) => void;
  isSetCheck: () => void;
};
export const usePostState = create<PostStateType>((set) => ({
  posts: [],
  isSet: false,
  url: defaultUrl,
  setPosts(value) {
    set(() => ({ posts: parsePosts(value), isSet: true }));
  },
  setUrl(url = defaultUrl, setFlag = true) {
    if (setFlag) {
      set((state) => {
        state.setPostsFromUrl(url);
        return state;
      });
    } else {
      set(() => {
        return { url };
      });
    }
  },
  setPostsFromUrl(url) {
    set((state) => {
      axios(url || state.url).then((r) => {
        state.setPosts(r.data);
      });
      return url ? { url } : state;
    });
  },
  isSetCheck() {
    set((state) => {
      if (!state.isSet) state.setPostsFromUrl();
      return state;
    });
  },
}));

export default function PostState({
  url,
  setFlag,
}: {
  url: string;
  setFlag?: boolean;
}) {
  const { setUrl } = usePostState();
  const isSet = useRef(false);
  useEffect(() => {
    if (!isSet.current) {
      setUrl(url, setFlag);
      isSet.current = true;
    }
  });

  return <></>;
}
