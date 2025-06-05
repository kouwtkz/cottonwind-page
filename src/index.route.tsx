import { ServerPostsGetRssData } from "@src/api/blog";
import { ImageSelectFromKey } from "@src/functions/media/serverDataFunction";
import { MakeRss } from "@src/functions/blogFunction";
import { toImageType } from "@src/functions/media/imageFunction";
import { MeeSqlD1 } from "@src/data/functions/MeeSqlD1";
import { concatOriginUrl, getMediaOrigin } from "@src/functions/originUrl";
import { RoutingUnion } from "@src/routes/RoutingList";
import { discordInviteMatch } from "@src/ServerContent";
import { CommonHono } from "@src/types/HonoCustomType";
import { app_workers } from "@src/workers";
import { LoginCheckMiddleware } from "@src/admin";
import { app_api } from "@src/api";
import { app_get } from "@src/get";
import { AddMetaEnv } from "@src/serverLayout";
import mediaApp from "@src/media";

export function MainPageRouteIndex(app: CommonHono) {
  app.route("/workers", app_workers);
  app.route("/api", app_api);
  app.use("/admin/*", LoginCheckMiddleware);
  app.route("/get/latest", app_get);
  app.get("/blog/rss.xml", async (c) => {
    const db = getCfDB({ context });;
    const postsData = await ServerPostsGetRssData(db, 10);
    return new Response(
      await MakeRss({
        env: c.env,
        db,
        postsData,
        url: request.url,
      }),
      {
        headers: {
          "Content-Type": "application/xml",
        },
      }
    );
  });
  app.post("/life/check", async (c) => {
    const body = await request.text();
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
  app.get("/api/discord/invite", async (c) => {
    return discordInviteMatch(c);
  });
  app.route("/media/", mediaApp);
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
