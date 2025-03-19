import { ServerPostsGetRssData } from "./api/blog";
import { ImageSelectFromKey } from "@/functions/media/serverDataFunction";
import { MakeRss } from "./functions/blogFunction";
import { toImageType } from "@/functions/media/imageFunction";
import { MeeSqlD1 } from "@/functions/database/MeeSqlD1";
import { concatOriginUrl, getMediaOrigin } from "./functions/originUrl";
import { RoutingUnion } from "./routes/RoutingList";
import { discordInviteMatch } from "./ServerContent";
import { CommonHono } from "./types/HonoCustomType";
import { app_workers } from "./workers";
import { LoginCheckMiddleware } from "./admin";
import { app_api } from "./api";
import { app_get } from "./get";
import { AddMetaEnv } from "./serverLayout";

export function ServerCommon(app: CommonHono) {
  app.route("/workers", app_workers);
  app.route("/api", app_api);
  app.use("/admin/*", LoginCheckMiddleware);
  app.route("/get/latest", app_get);
  app.get("/blog/rss.xml", async (c) => {
    const db = new MeeSqlD1(c.env.DB);
    const postsData = await ServerPostsGetRssData(db, 10);
    return new Response(
      await MakeRss({
        env: c.env,
        db,
        postsData,
        url: c.req.url,
      }),
      {
        headers: {
          "Content-Type": "application/xml",
        },
      }
    );
  });
  app.post("/life/check", async (c) => {
    const body = await c.req.text();
    const result = c.env.LIFE_CHECK_CHALLENGE === body;
    if (result) return c.text(c.env.LIFE_CHECK_VERIFIER ?? "");
    else return c.text("401 Unauthorized", 401);
  });
  app.get("/env.json", async (c) => {
    const {
      DB,
      KV,
      NOTICE_FEED_KV,
      AUTHOR_EMAIL,
      DISCORD_INVITE_ANSWER,
      DISCORD_INVITE_URL,
      FEED_DEV_FROM,
      X_CLIENT_ID,
      X_CLIENT_SECRET,
      LOGIN_TOKEN,
      LIFE_CHECK_CHALLENGE,
      LIFE_CHECK_VERIFIER,
      LIFE_CHECKER_URL,
      ..._env
    } = AddMetaEnv(c.env);
    const env = _env as SiteConfigEnv;
    return c.json(env);
  });
  app.get("/fetch/discord/invite", async (c) => {
    return discordInviteMatch(c);
  });
}

export function NoIndex(path: RoutingUnion) {
  switch (path) {
    case "admin":
    case "admin/:key":
    case "suggest":
    case "log":
      return true;
    default:
      return;
  }
}
