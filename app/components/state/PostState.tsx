import { useEffect, useSyncExternalStore } from "react";
import { useEnv } from "~/components/state/EnvState";
import { postsDataIndexed } from "~/data/ClientDBLoader";
import { CreateObjectState } from "./CreateState";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";

interface usePostsType {
  posts?: PostType[];
  postsMap?: Map<string, PostType>;
  postsData?: MeeIndexedDBTable<PostType>;
}
export const usePosts = CreateObjectState<usePostsType>();

export default function PostState() {
  const { Set } = usePosts();
  const postsData = useSyncExternalStore(
    postsDataIndexed?.subscribe || (() => () => {}),
    () => postsDataIndexed?.table
  );
  useEffect(() => {
    if (postsData?.db) {
      postsData
        .find({ where: { body: { has: true }, postId: { has: true } } })
        .then((posts) => {
          const postsMap = new Map(posts.map((v) => [v.postId!, v]));
          Set({ postsData, posts, postsMap });
        });
    }
  }, [postsData]);
  return <></>;
}
