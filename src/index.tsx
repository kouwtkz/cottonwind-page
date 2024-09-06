import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { RoutingList } from "./routes/RoutingList";
import { ReactResponse, ServerNotFound, Style } from "./serverLayout";
import { IsLogin } from "./ServerContent";
import { renderHtml } from "./functions/render";
import { ServerCommon } from "./server";
import { cors } from "hono/cors";

const app = new Hono<MeePagesBindings>({ strict: true });

app.use("*", (c, next) => {
  const origin = c.env.CORS_ORIGIN ?? ["http://localhost:51731"];
  return cors({ origin })(c, next);
});
// app.get("/assets/*", serveStatic());

ServerCommon(app);

RoutingList.forEach((path) => {
  app.get(path, async (c, next) => {
    if (
      c.req.url.startsWith(c.env.PAGES_DEV_ORIGIN ?? "") &&
      (await c.env.NOTICE_FEED_KV.get("life-check")) !== "false"
    ) {
      const Url = new URL(c.req.url);
      if (c.env.ORIGIN) {
        const redirectUrl = new URL(c.env.ORIGIN);
        redirectUrl.pathname = Url.pathname;
        redirectUrl.search = Url.search;
        redirectUrl.hash = Url.hash;
        return c.redirect(redirectUrl.href);
      }
    }
    return next();
  });
  app.get(path, (c, next) => {
    const version = c.env?.VERSION ? "?v=" + c.env.VERSION : "";
    return ReactResponse({
      c,
      next,
      path,
      styles: <Style href="/css/styles.css" />,
      script: <script type="module" src="/static/js/client.js" />,
      isLogin: IsLogin(c),
    });
  });
});

app.all("*", async (c, next) => {
  if (!/.+\/+$/.test(c.req.path))
    return c.html(renderHtml(<ServerNotFound />), { status: 404 });
  else return next();
});

app.use(trimTrailingSlash());

export default app;
