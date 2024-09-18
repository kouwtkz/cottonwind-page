import { ServerPostsGetRssData } from "./api/blog";
import { MakeRss } from "./functions/blogFunction";
import { toImageType } from "./functions/imageFunctions";
import { MeeSqlD1 } from "./functions/MeeSqlD1";
import { concatOriginUrl, getMediaOrigin } from "./functions/originUrl";
import { RoutingUnion } from "./routes/RoutingList";
import { discordInviteMatch } from "./ServerContent";
import { ImageSelectFromKey } from "./serverLayout";
import { CommonHono } from "./types/HonoCustomType";
import { app_workers } from "./workers";

export function ServerCommon(app: CommonHono) {
  app.get("/blog/rss.xml", async (c) => {
    const mediaOrigin = getMediaOrigin(c.env, c.req.url);
    const db = new MeeSqlD1(c.env.DB);
    let image_url: string | undefined;
    const postsData = await ServerPostsGetRssData(db, 10);
    if (c.env.SITE_IMAGE) {
      const data = await ImageSelectFromKey(db, c.env.SITE_IMAGE);
      if (data) image_url = data.webp || data.src || undefined;
    }
  if (image_url && mediaOrigin) image_url = concatOriginUrl(mediaOrigin, image_url);
    return new Response(MakeRss(c.env, postsData, image_url), {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  });
  app.post("/life/check", async (c) => {
    const body = await c.req.text();
    const result = c.env.LIFE_CHECK_CHALLENGE === body;
    if (result) return c.text(c.env.LIFE_CHECK_VERIFIER ?? "");
    else return c.text("401 Unauthorized", 401);
  });
  app.route("/workers", app_workers);
  app.get("/fetch/discord/invite", async (c) => {
    return discordInviteMatch(c);
  });
}

export function NoIndex(path: RoutingUnion) {
  switch (path) {
    case "setting":
    case "setting/:key":
    case "suggest":
      return true;
    default:
      return;
  }
}
