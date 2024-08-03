import { Hono } from "hono";
import { app_blog_api } from "./blog/api";
export const app = new Hono<MeeBindings>();

app.route("/blog", app_blog_api);

export const app_api = app;
