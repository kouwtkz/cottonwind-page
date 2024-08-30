import { CommonContext } from "@/types/HonoCustomType";
import GenerateRss from "@/functions/doc/GenerateRss";
import { parse } from "marked";
import getPosts from "@/blog/getPosts";

export async function getPostsData(c: CommonContext) {
  const rawPosts: Post[] = JSON.parse(await c.env.KV.get("posts") || '[]');
  const posts = rawPosts.filter(post => post);
  posts.forEach(post => {
    post.date = post.date ? new Date(post.date) : null;
    post.updatedAt = post.updatedAt ? new Date(post.updatedAt) : null;
  })
  return posts;
}
export async function setPostsData(c: CommonContext, posts: Post[]) {
  posts.forEach((post) => { post.body = post.body?.replace(/\r\n/g, "\n") });
  await c.env.KV.put("posts", JSON.stringify(posts));
}

export function GetPostsRssOption(rawPosts: Post[]) {
  const { posts } = getPosts({ posts: rawPosts, take: 30, common: true })
  return posts;
}

const SITE_URL = "https://cottonwind.com";

export async function MakeRss(c: CommonContext) {
  return GenerateRss(
    {
      title: import.meta.env.VITE_TITLE,
      description: import.meta.env.VITE_DESCRIPTION,
      feed_url: `${SITE_URL}/rss.xml`,
      site_url: SITE_URL + "/blog",
      language: "ja",
      image_url: `${SITE_URL}${import.meta.env.VITE_SITE_IMAGE}`,
      items:
        GetPostsRssOption(await getPostsData(c)).map((post) => {
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
            date: post.date || new Date(0),
          })
        })
    }
  )
}

