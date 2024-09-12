import { discordInviteMatch } from "./ServerContent";
import { CommonHono } from "./types/HonoCustomType";
import { app_workers } from "./workers";
import { MakeRss } from "./functions/blogFunction";
import { ServerPostsGetRssData } from "@/api/blog";
import { cache } from "hono/cache";

export function ServerCommon(app: CommonHono) {
  app.post("/life/check", async (c) => {
    const body = await c.req.text();
    const result = c.env.LIFE_CHECK_CHALLENGE === body;
    if (result) return c.text(c.env.LIFE_CHECK_VERIFIER ?? "");
    else return c.text("401 Unauthorized", 401);
  });
  app.route("/workers", app_workers);
  app.get(
    "/blog/rss.xml",
    cache({
      cacheName: "blog-rss",
      cacheControl: "max-age=1800",
    })
  );
  app.get("/blog/rss.xml", async (c) => {
    const postsData = await ServerPostsGetRssData(c.env, 10);
    return new Response(MakeRss(c.env, postsData), {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  });
  app.get("/fetch/discord/invite", async (c) => {
    return discordInviteMatch(c);
  });
}
