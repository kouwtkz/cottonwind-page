import { useEffect, useSyncExternalStore } from "react";
import { useEnv } from "~/components/state/EnvState";
import { postsDataIndexed } from "~/data/ClientDBLoader";
import { CreateObjectState } from "./CreateState";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import { ExternalStoreProps } from "~/data/IndexedDB/IndexedDataLastmodMH";

interface usePostsType {
  posts?: PostType[];
  postsMap?: Map<string, PostType>;
  postsData?: MeeIndexedDBTable<PostType>;
}
export const usePosts = CreateObjectState<usePostsType>();

export default function PostState() {
  const { Set } = usePosts();
  const postsData = useSyncExternalStore(
    ...ExternalStoreProps(postsDataIndexed)
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
