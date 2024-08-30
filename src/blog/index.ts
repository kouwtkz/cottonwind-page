import { Hono } from "hono";
import { getPostsData, setPostsData } from "@/blog/be-functions";
import { MakeRss } from "@/blog/be-functions";
import { IsLogin } from "@/ServerContent";

export const app = new Hono<MeePagesBindings>();

app.get("/posts.json", async (c) => {
  try {
    const posts = await getPostsData(c);
    if ('dl' in c.req.query() && IsLogin(c))
      return c.newResponse(JSON.stringify(posts), {
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });
    return c.json(posts);
  } catch (e) {
    console.error(e);
    return c.json([]);
  }
});

app.get("/rss.xml", async (c) => {
  return new Response(await MakeRss(c), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
});

export const app_blog = app;
