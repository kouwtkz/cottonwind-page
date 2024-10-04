import { CommonContext } from "@/types/HonoCustomType";
import GenerateRss from "@/functions/doc/GenerateRss";
import { parse } from "marked";
import { findMee, setWhere } from "@/functions/find/findMee";

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

export function MakeRss(env: MeeCommonEnv, postsData: PostDataType[], image_url?: string) {
  const SITE_URL = env.ORIGIN;
  return GenerateRss(
    {
      title: env.TITLE ?? "",
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
        postsData.map((post) => {
          let Url = new URL(`${SITE_URL}/blog?postId=${post.postId}`);
          let description = String(parse(post.body || "", { async: false }));
          description = description.replace(/(href=")([^"]+)(")/g, (m, m1, m2, m3) => {
            if (!/^https?\:\/\//.test(m2)) {
              if (/^[^\/\?\#]/.test(m2)) m2 = "/" + m2;
              return m1 + SITE_URL + m2 + m3;
            } else return m;
          })
          description = description.replace(/(<img .*src=")(\?[^"]+)(".*>)/g, (m, m1, m2, m3) => {
            const alt_m = String(m3).match(/alt="([^"]+)"/);
            const alt = "[画像]" + (alt_m ? alt_m[1] : "");
            const s = { ...Object.fromEntries(Url.searchParams), ...Object.fromEntries(new URLSearchParams(m2)) };
            return `<a href="${Url.origin + Url.pathname + "?" + String(new URLSearchParams(s))}">${alt}</a>`
          });
          return ({
            title: post.title || "",
            description,
            url: Url.href,
            guid: `${SITE_URL}/blog?postId=${post.postId}`,
            date: post.time ? new Date(post.time) : new Date(0),
          })
        })
    }
  )
}

