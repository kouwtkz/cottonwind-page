import { Hono } from "hono";
import { app_blog_api } from "../blog/api";
export const app = new Hono<MeeAPIBindings>();
import { cors } from 'hono/cors';

app.use("*", (c, next) => {
  const origin = c.env.CORS_ORIGIN ?? ["http://localhost:51730"];
  return cors({ origin })(c, next)
})

app.route("/blog", app_blog_api);

app.get("/", (c) => {
  return c.text("めぇ")
})

export default app;
