import { Hono } from "hono";
import { app_blog_api } from "../blog/api";
import { cors } from 'hono/cors';
import { app_test_api } from "./test";
import { scheduleTask } from "./schedule";

export const app = new Hono<MeeAPIBindings>();

app.use("*", (c, next) => {
  const origin = c.env.CORS_ORIGIN ?? ["http://localhost:51730"];
  return cors({ origin, credentials: true })(c, next)
})

app.route("/blog", app_blog_api);
app.route("/test", app_test_api);

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
