import { CommonContext } from "@/types/HonoCustomType";
import GenerateRss from "@/functions/doc/GenerateRss";
import { parse } from "marked";
import { findMee, setWhere } from "@/functions/find/findMee";
import { MeeSqlD1 } from "./database/MeeSqlD1";
import { concatOriginUrl, getMediaOrigin } from "./originUrl";
import { ImageSelectFromKey } from "./media/serverDataFunction";

export async function getPostsData(c: CommonContext) {
  const kvPosts = await c.env.KV.get("posts");
  const rawPosts: PostType[] = JSON.parse(kvPosts || '[]');
  const posts = rawPosts.filter(post => post);
  posts.forEach(post => {
    post.time = post.time ? new Date(post.time) : undefined;
    post.lastmod = post.lastmod ? new Date(post.lastmod) : undefined;
  })
  return posts;
}
export async function setPostsData(c: CommonContext, posts: PostType[]) {
  posts.forEach((post) => { post.body = post.body?.replace(/\r\n/g, "\n") });
  await c.env.KV.put("posts", JSON.stringify(posts));
}

interface getPostsProps {
  posts: PostType[];
  update?: boolean;
  take?: number;
  page?: number;
  q?: string;
  common?: boolean;
  pinned?: boolean;
}
export function getPosts({
  posts,
  take,
  page,
  common,
  q = "",
  pinned = false,
}: getPostsProps) {
  if (page) page--;
  const skip = take && page ? take * page : 0;
  const options: WhereOptionsKvType<PostType> = {
    text: { key: "body" },
    hashtag: { textKey: "body", key: "category" },
  };
  const wheres = [setWhere(q, options).where];
  if (common) wheres.push({ draft: false, time: { lte: new Date() } });
  const orderBy: any[] = [];
  if (pinned) orderBy.push({ pin: "desc" });
  orderBy.push({ time: "desc" });

  try {
    let postsResult: PostType[] = findMee({
      list: posts,
      where: {
        AND: wheres,
      },
      orderBy,
    });
    const count = postsResult.length;
    postsResult = postsResult.filter((post, i) => {
      if (take !== undefined && i >= take + skip) return false;
      return ++i > skip;
    });
    const max = Math.ceil(count / (take || count));
    return { posts: postsResult, count, max };
  } catch (e) {
    console.log(e);
    return { posts: [], count: 0, max: 0 };
  }
}

export function GetPostsRssOption(rawPosts: PostType[]) {
  const { posts } = getPosts({ posts: rawPosts, take: 30, common: true })
  return posts;
}

export function autoPostId() {
  const now = new Date();
  const days = Math.floor(
    (now.getTime() - new Date("2000-1-1").getTime()) / 86400000
  );
  const todayBegin = new Date(Math.floor(now.getTime() / 86400000) * 86400000);
  return (
    days.toString(32) +
    ("0000" + (now.getTime() - todayBegin.getTime()).toString(30)).slice(-4)
  );
}

interface MakeRssProps {
  env: MeeCommonEnv;
  db: MeeSqlD1;
  url: string;
  postsData: PostDataType[];
}
export async function MakeRss({ env, db, url, postsData }: MakeRssProps) {
  const Url = new URL(url);
  const SITE_URL = Url.origin;
  const mediaOrigin = getMediaOrigin(env, url);
  const imagesDataMap = new Map<string, ImageDataType>();
  async function getImagesData(key?: string | null) {
    let imageData: ImageDataType | undefined;
    if (key) {
      imageData = imagesDataMap.get(key);
      if (!imageData) {
        imageData = await ImageSelectFromKey(db, key);
        if (imageData) imagesDataMap.set(key, imageData);
      }
    }
    return imageData;
  }
  let image_url: string | undefined;
  if (env.SITE_IMAGE) {
    const data = await getImagesData(env.SITE_IMAGE);
    if (data) image_url = data.src || undefined;
  }
  if (image_url && mediaOrigin)
    image_url = concatOriginUrl(mediaOrigin, image_url);
  return GenerateRss(
    {
      title: env.TITLE || "",
      description: env.DESCRIPTION,
      feed_url: `${SITE_URL}/rss.xml`,
      site_url: SITE_URL + "/blog",
      language: "ja",
      image_url,
      pubDate: new Date(postsData.reduce((a, c) => {
        const lastmod = c.lastmod || "";
        return a > lastmod ? a : lastmod
      }, "")).toUTCString(),
      items:
        await Promise.all(postsData.map(async (post) => {
          let Url = new URL("/blog?postId=" + post.postId, SITE_URL);
          let description = String(parse(post.body || "", { async: false }));
          description = description.replace(/(href=")([^"]+)(")/g, (m, m1, m2, m3) => {
            if (!/^https?\:\/\//.test(m2)) {
              if (/^[^\/\?\#]/.test(m2)) m2 = "/" + m2;
              return m1 + SITE_URL + m2 + m3;
            } else return m;
          })
          const matches = Array.from(description.matchAll(/(<img .*src=")(\?[^"]+)(".*>)/g));
          let index = 0;
          let replaceDescription = "";
          for (const m of matches) {
            replaceDescription = replaceDescription + description.slice(index, m.index);
            index = m.index + m[0].length;
            const searchParams = new URLSearchParams(m[2]);
            const alt_m = String(m).match(/alt="([^"]+)"/);
            let alt = alt_m ? alt_m[1] : "";
            const s = { ...Object.fromEntries(Url.searchParams), ...Object.fromEntries(searchParams) };
            const href = Url.origin + Url.pathname + "?" + String(new URLSearchParams(s));
            const imageData = await getImagesData(searchParams.get("image")!);
            if (imageData) {
              alt = alt || imageData.title || "";
              replaceDescription = `<a href="${href}"><img alt="${alt}" src="${concatOriginUrl(mediaOrigin, imageData.src)}" /></a>`
            } else {
              replaceDescription = `<a href="${href}">[画像]${alt}</a>`
            }
          }
          if (replaceDescription) {
            description = replaceDescription + description.slice(index);
          }
          return ({
            title: post.title || "",
            description,
            url: Url.href,
            guid: `${SITE_URL}/blog?postId=${post.postId}`,
            date: post.time ? new Date(post.time) : new Date(0),
          })
        }))
    }
  )
}

