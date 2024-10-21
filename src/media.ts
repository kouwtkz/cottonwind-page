import { Hono } from "hono";
import { cache } from 'hono/cache'
import { cors } from "hono/cors";
import { getMimeType } from "hono/utils/mime";

export const app = new Hono<MeeBindings<MeeR2Env>>();

app.get("*", cors({ origin: "*", credentials: true }));

app.get(
  "*",
  async (c, next) => {
    if (c.env.DEV) return next();
    else return cache({
      cacheName: 'media-cache',
      cacheControl: 'max-age=86400',
    })(c, next);
  }
);
app.get("*", async (c, next) => {
  const root = c.req.routePath.slice(0, -2);
  let pathname = c.req.path.replace(/\/+/g, "/");
  if (root) pathname = pathname.replace(root, "");
  const filename = pathname.slice(pathname.indexOf("/", 0) + 1);
  if (filename) {
    const mimeType = getMimeType(filename);
    const data = await c.env.BUCKET.get(filename).then(r => r?.blob());
    if (data)
      return c.body(await data.arrayBuffer(), {
        headers: mimeType ? { "Content-Type": mimeType } : {},
      });
  }
  return c.notFound();
});

const mediaApp = app;
export default mediaApp;
