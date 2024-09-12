import { Hono } from "hono";
import { app_blog_api } from "./blog";
import { cors } from 'hono/cors';
import { app_test_api } from "./test";
import { scheduleTask } from "./schedule";
import { FeedSet } from "@/ServerContent";
import { app_image_api } from "./image";
import { app_character_api } from "./character";
import { app_data_api } from "./data";

export const app = new Hono<MeeBindings<MeeAPIEnv>>();

app.use("*", (c, next) => {
  const origin = c.env.CORS_ORIGIN ?? ["http://localhost:51730"];
  return cors({ origin, credentials: true })(c, next)
})

app.route("/blog", app_blog_api);
app.route("/test", app_test_api);
app.route("/image", app_image_api);
app.route("/character", app_character_api);
app.route("/data", app_data_api);
import { cache } from 'hono/cache'

app.get("/feed/get", cache({
  cacheName: "feed-get",
  cacheControl: "max-age=1800",
}));
app.get("/feed/get", async (c, next) => {
  if (c.env.FEED_FROM) {
    return c.json(await FeedSet({ url: c.env.FEED_FROM, env: c.env, minute: 10 }));
  } else return next();
});

const scheduled: ExportedHandlerScheduledHandler<MeeAPIEnv> = async (event, env, ctx) => {
  ctx.waitUntil(scheduleTask(event, env));
};

export default {
  fetch: app.fetch,
  scheduled,
};
