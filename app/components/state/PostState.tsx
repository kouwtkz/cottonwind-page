import { useEffect, useMemo, useSyncExternalStore } from "react";
import { postsDataIndexed, waitIdb } from "~/data/ClientDBLoader";
import { CreateObjectState } from "./CreateState";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import { ExternalStoreProps } from "~/data/IndexedDB/IndexedDataLastmodMH";
import { SubscribeDataClass } from "../hook/SubscribeEvents";
import { useExtRss } from "./ExtRssState";
import { useATProtoState } from "./ATProtocolState";

interface usePostsType {
  posts?: PostType[];
  postsMap?: Map<string, PostType>;
  postsData?: MeeIndexedDBTable<PostType>;
}
export const usePosts = CreateObjectState<usePostsType>();

export default function PostState() {
  const { Set, posts } = usePosts();
  const postsData = useSyncExternalStore(
    ...ExternalStoreProps(postsDataIndexed),
  );
  const extRss = useExtRss();
  const { mochott_Article } = useATProtoState();
  const mixPosts = useMemo(() => {
    const list: PostPagesItemType[] = posts ? posts.concat() : [];
    if (extRss) {
      extRss.forEach((channel) => {
        const topLink = channel.link;
        const topLinkURL = new URL(topLink);
        const host = topLinkURL.host;
        channel.items.forEach((item) => {
          list.push({
            host,
            extension: "ExtRSS",
            title: item.title,
            body: item.description,
            time: new Date(item.pubDate),
            link: item.link,
            postId: item.guid,
            draft: false,
          });
        });
      });
    }
    if (mochott_Article) {
      mochott_Article.forEach((item) => {
        if (item.minisite && item.minisite.designType !== "blog") return;
        const postId = item.$type + item.path;
        const category: string[] = [];
        if (item.category) category.push(item.category);
        if (item.tags) category.push(...item.tags);
        list.push({
          host: item.host,
          extension: "Mochott",
          title: item.title,
          body: item,
          time: new Date(item.createdAt),
          link: item.url?.href,
          postId,
          category,
          draft: false,
        });
      });
    }
    return list;
  }, [posts, extRss, mochott_Article]);
  useEffect(() => {
    (async () => {
      await waitIdb;
      if (postsData?.db) {
        postsData
          .find({ where: { body: { has: true }, postId: { has: true } } })
          .then((posts) => {
            const postsMap = new Map(posts.map((v) => [v.postId!, v]));
            Set({ postsData, posts, postsMap });
          });
      }
    })();
  }, [postsData, Set]);
  useEffect(() => {
    MixPosts.SetData(mixPosts);
  }, [mixPosts]);
  return <></>;
}

export const MixPosts = new SubscribeDataClass<PostPagesItemType[] | null>(
  null,
);

export function useMixPosts() {
  return useSyncExternalStore(
    MixPosts.subscribeEvent.subscribe,
    MixPosts.GetData.bind(MixPosts),
    () => null,
  );
}
