import { Hono } from "hono";
import { getPostsData, setPostsData } from "@/blog/be-functions";
import { MakeRss } from "@/blog/be-functions";
import { IsLogin } from "@/ServerContent";

export const app = new Hono<MeePagesBindings>();

app.get("/rss.xml", async (c) => {
  return new Response(await MakeRss(c), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
});

export const app_blog = app;
