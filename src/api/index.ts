import { Hono } from "hono";
import { app_blog_api } from "../blog/api";
import { cors } from 'hono/cors';
import { app_test_api } from "./test";
import { scheduleTask } from "./schedule";
import { FeedSet } from "@/ServerContent";

export const app = new Hono<MeeAPIBindings>();

app.use("*", (c, next) => {
  const origin = c.env.CORS_ORIGIN ?? ["http://localhost:51730"];
  return cors({ origin, credentials: true })(c, next)
})

app.route("/blog", app_blog_api);
app.route("/test", app_test_api);

app.get("/feed/get", async (c, next) => {
  if (c.env.FEED_FROM) {
    return c.json(await FeedSet({ url: c.env.FEED_FROM, c, minute: 10 }));
  } else return next();
});

app.get("/", (c) => {
  return c.text("めぇ")
})

const scheduled: ExportedHandlerScheduledHandler<MeeAPIEnv> = async (event, env, ctx) => {
  ctx.waitUntil(scheduleTask(event, env));
};

export default {
  fetch: app.fetch,
  scheduled,
};
