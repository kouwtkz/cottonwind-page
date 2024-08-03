import { Hono } from "hono";
import { app_blog_api } from "./blog/api";
export const app = new Hono<MeeBindings>();

app.route("/blog", app_blog_api);
app.post("/life", async (c) => {
  const body = await c.req.text();
  const result = c.env.LIFE_CHECK_CHALLENGE === body;
  if (result) return c.text(c.env.LIFE_CHECK_VERIFIER ?? "");
  else return c.text("401 Unauthorized", 401);
});

export const app_api = app;
