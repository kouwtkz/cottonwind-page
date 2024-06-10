// @ts-check

import getPosts from "./getPosts.mjs";
import { parse } from "marked";
import { getPostsData } from "../postDataFunction";
import { CommonContext } from "@/types/HonoCustomType";
import GenerateRss from "@/components/doc/GenerateRss";

const SITE_URL = import.meta.env.VITE_URL;

export function GetPostsRssOption(rawPosts: Post[]) {
  const { posts } = getPosts({ posts: rawPosts, take: 30, common: true })
  return posts;
}

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
        GetPostsRssOption(await getPostsData(c)).map((post) => ({
          title: post.title || "",
          description: String(parse((post.body || "").replace(/(\[[^\]]*\]\()(\/[^)]+\))/g, `$1${SITE_URL}$2`), { async: false })),
          url: `${SITE_URL}/blog?postId=${post.postId}`,
          guid: `${SITE_URL}/blog?postId=${post.postId}`,
          date: post.date || new Date(0),
        }))
    }
  )
}

