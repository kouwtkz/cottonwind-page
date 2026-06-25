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
        if (item.minisite?.designType !== "blog") return;
        const body = (
          <div className="parsed">
            {item.content.content.reduce<React.ReactNode[]>((a, c, i) => {
              if (c.type === "paragraph") {
                if (c.content) {
                  const list: React.ReactNode[][] = [];
                  let insert = true;
                  c.content.reduce<React.ReactNode[]>((a, c, j) => {
                    if (c.type === "text") {
                      if (insert) {
                        a = [c.text];
                        list.push(a);
                      } else {
                        a.push(c.text);
                        insert = true;
                      }
                      return a;
                    } else {
                      if (c.type === "hardBreak") {
                        a.push(<br key={"br-" + j} />);
                      }
                      insert = false;
                      return a;
                    }
                  }, []);
                  a.push(...list.map((v, j) => <p key={`${i}-${j}`}>{v}</p>));
                }
              } else if (c.type === "image") {
                const url = new URL(c.attrs.src, item.url?.href);
                a.push(
                  <img
                    key={i}
                    alt={c.attrs.alt}
                    title={c.attrs.title}
                    src={url.href}
                  />,
                );
              }
              return a;
            }, [])}
          </div>
        );
        const category: string[] = [];
        if (item.category) category.push(item.category);
        if (item.tags) category.push(...item.tags);
        list.push({
          host: item.host,
          extension: "Mochott",
          title: item.title,
          body,
          time: new Date(item.createdAt),
          link: item.url?.href,
          postId: item.$type + item.path,
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
