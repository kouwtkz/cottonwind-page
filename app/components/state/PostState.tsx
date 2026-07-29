import { useEffect, useMemo, useSyncExternalStore } from "react";
import { postsDataIndexed, waitIdb } from "~/data/ClientDBLoader";
import { CreateObjectState } from "./CreateState";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import { ExternalStoreProps } from "~/data/IndexedDB/IndexedDataLastmodMH";
import { SubscribeDataClass } from "~/data/subscribe/SubscribeEvents";
import { useExtRss } from "./ExtRssState";
import { useATProtoState } from "./ATProtocolState";
import { StrToInstant } from "../functions/time/TemporalFunction";
import { convertTimeToMeeIndexedData } from "~/data/IndexedDB/ConvertToMeeIndexedData";

interface usePostsType {
  posts?: PostType[];
  postsMap?: Map<string, PostType>;
  postsData?: MeeIndexedDBTable<PostIndexedDataType>;
}
export const usePosts = CreateObjectState<usePostsType>();

export default function PostState() {
  const { Set, posts } = usePosts();
  const postsData = useSyncExternalStore(
    ...ExternalStoreProps(postsDataIndexed),
  );
  const extRss = useExtRss();
  const { mochott_articles } = useATProtoState();
  const mixPosts = useMemo(() => {
    const list: PostPagesItemType[] = posts ? posts.concat() : [];
    if (extRss) {
      extRss.forEach((channel) => {
        const topLink = channel.link;
        const topLinkURL = new URL(topLink);
        const host = topLinkURL.host;
        channel.items.forEach((item) => {
          if (item.pubDate)
            list.push({
              host,
              extension: "ExtRSS",
              title: item.title,
              body: item.description,
              time: StrToInstant(item.pubDate).toZonedDateTimeISO(
                Temporal.Now.timeZoneId(),
              ),
              link: item.link,
              category: item.category,
              postId: item.guid,
              draft: false,
            });
        });
      });
    }
    if (mochott_articles) {
      mochott_articles.forEach((item) => {
        if (item.minisite && item.minisite.designType !== "blog") return;
        const postId = item.$type + item.path;
        const category: string[] = [];
        if (item.category) category.push(item.category);
        if (item.tags) category.push(...item.tags);
        list.push({
          host: item.host,
          extension: "mochott",
          title: item.title,
          body: item,
          time: StrToInstant(item.createdAt).toZonedDateTimeISO(
            Temporal.Now.timeZoneId(),
          ),
          link: item.url?.href,
          postId,
          category,
          draft: false,
        });
      });
    }
    return list;
  }, [posts, extRss, mochott_articles]);
  useEffect(() => {
    (async () => {
      await waitIdb;
      if (postsData?.db) {
        postsData
          .find({ where: { body: { has: true }, postId: { has: true } } })
          .then((items) =>
            items.map((item) =>
              convertTimeToMeeIndexedData<PostType>({
                item,
                convert: postsDataIndexed.options.convert,
              }),
            ),
          )
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
