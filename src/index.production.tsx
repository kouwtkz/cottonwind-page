import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { RoutingList } from "@src/routes/RoutingList";
import { DefaultReactResponse, ServerNotFound, Style } from "@src/serverLayout";
import { IsLogin } from "@src/admin";
import { renderHtml } from "@src/functions/render";
import { NoIndex, MainPageRouteIndex } from "@src/index.route";
import { cors } from "hono/cors";
import { cache } from "hono/cache";
import { DefaultImportScripts } from "@src/clientScripts";

const app = new Hono<MeePagesBindings>({ strict: true });

app.use("*", (c, next) => {
  const origin = c.env.CORS_ORIGIN ?? ["http://localhost:51731"];
  return cors({ origin })(c, next);
});
// app.get("/assets/*", serveStatic());

app.get(
  "/blog/rss.xml",
  cache({
    cacheName: "blog-rss",
    cacheControl: "max-age=1800",
  })
);

MainPageRouteIndex(app);
RoutingList.forEach((path) => {
  app.get(path, async (c, next) => {
    if (
      request.url.startsWith(c.env.CF_DEV_ORIGIN ?? "") &&
      (await c.env.NOTICE_FEED_KV.get("life-check")) !== "false"
    ) {
      const Url = new URL(request.url);
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
    return DefaultReactResponse({
      c,
      next,
      path,
      style: (
        <>
          <Style href="/css/styles.css" />
          <Style href="/css/styles_lib.css" />
        </>
      ),
      isLogin: IsLogin(c),
      noindex: NoIndex(path),
    });
  });
});

app.all("*", async (c, next) => {
  if (!/.+\/+$/.test(request.path))
    return c.html(renderHtml(<ServerNotFound />), { status: 404 });
  else return next();
});

app.use(trimTrailingSlash());

export default app;
