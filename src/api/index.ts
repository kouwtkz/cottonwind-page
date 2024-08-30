import { Hono } from "hono";
import { app_blog_api } from "../blog/api";
export const app = new Hono<MeePagesBindings>();

app.route("/blog", app_blog_api);

app.get("/", (c) => {
  return c.text("めぇ")
})

export default app;
