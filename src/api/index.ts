import { Hono } from "hono";
import { cache } from 'hono/cache'
import { app_blog_api } from "../blog/api";
import { cors } from 'hono/cors';
import { app_test_api } from "./test";
import { scheduleTask } from "./schedule";
import { FeedSet } from "@/ServerContent";
import { app_image_api } from "./image";
import { getMimeType } from "hono/utils/mime";
import { app_character_api } from "./character";

export const app = new Hono<MeeAPIBindings>();

app.use("*", (c, next) => {
  const origin = c.env.CORS_ORIGIN ?? ["http://localhost:51730"];
  return cors({ origin, credentials: true })(c, next)
})

app.route("/blog", app_blog_api);
app.route("/test", app_test_api);
app.route("/image", app_image_api);
app.route("/character", app_character_api);

app.get("/feed/get", async (c, next) => {
  if (c.env.FEED_FROM) {
    return c.json(await FeedSet({ url: c.env.FEED_FROM, env: c.env, minute: 10 }));
  } else return next();
});

app.get(
  "/r2/*",
  cache({
    cacheName: 'r2-cache',
    cacheControl: 'max-age=86400',
  })
);
app.get("/r2/*", async (c, next) => {
  if (!c.req.url.startsWith(c.env.API_ORIGIN!)) {
    const Url = new URL(c.req.url);
    const pathname = decodeURI(Url.pathname).replace(/\/+/g, "/");
    const filename = pathname.slice(pathname.indexOf("/", 1) + 1);
    if (filename) {
      const mimeType = getMimeType(filename);
      const item = await c.env.BUCKET.get(filename);
      const b = await item?.blob();
      if (b)
        return c.body(await b.arrayBuffer(), {
          headers: mimeType ? { "Content-Type": mimeType } : {},
        });
    }
  }
  return next();
});

const scheduled: ExportedHandlerScheduledHandler<MeeAPIEnv> = async (event, env, ctx) => {
  ctx.waitUntil(scheduleTask(event, env));
};

export default {
  fetch: app.fetch,
  scheduled,
};
