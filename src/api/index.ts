import { Hono } from "hono";
import { cors } from 'hono/cors';
import { cache } from 'hono/cache'
import { FeedSet } from "@/ServerContent";
import { app_data_api } from "./data";
import { app_image_api } from "./image";
import { app_character_api } from "./character";
import { app_blog_api } from "./blog";
import { app_sound_api } from "./sound";
import { app_files_api as app_file_api } from "./file";
import { app_links_api } from "./links";
import { getOriginFromAPI } from "@/functions/originUrl";
import { AddMetaEnv } from "@/serverLayout";
import { app_like_api } from "./like";
import { KeyValueDBDataOptions } from "@/data/DataEnv";
import { app_kvdb_api } from "./KeyValueDB";

export const app = new Hono<MeeBindings<MeeCommonEnv>>();

app.use("*", (c, next) => {
  const Url = new URL(c.req.url);
  const origin: string[] = [];
  const env = AddMetaEnv(c.env);
  const autoOrigin = getOriginFromAPI(env, Url.origin);
  if (autoOrigin) origin.push(autoOrigin);
  if (env.CORS_ORIGIN) origin.push(...env.CORS_ORIGIN);
  return cors({ origin, credentials: true })(c, next)
})

app.get("/", (c) => c.text(new Date().toISOString()));
app.route("/image", app_image_api);
app.route("/character", app_character_api);
app.route("/blog", app_blog_api);
app.route("/sound", app_sound_api);
app.route("/file", app_file_api);
app.route("/links", app_links_api);
app.route("/like", app_like_api);
app.route(KeyValueDBDataOptions.src, app_kvdb_api);
app.route("/data", app_data_api);

app.get("/feed/get", cache({
  cacheName: "feed-get",
  cacheControl: "max-age=1800",
}));
app.get("/feed/get", async (c, next) => {
  if (c.env.FEED_FROM) {
    return c.json(await FeedSet({ url: c.env.FEED_FROM, env: c.env, minute: 10 }));
  } else return next();
});

export const app_api = app;
