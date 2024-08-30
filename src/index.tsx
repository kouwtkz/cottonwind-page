import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { RoutingList } from "./routes/RoutingList";
import { ReactResponse, ServerNotFound, Style } from "./serverLayout";
import { FeedSet, IsLogin } from "./ServerContent";
import { renderToString } from "react-dom/server";
import { serverCharacters as characters } from "./data/server/characters";
import { ServerCommon } from "./server";
import { cors } from "hono/cors";

const app = new Hono<MeePagesBindings>({ strict: true });

app.use("*", (c, next) => {
  const origin = c.env.CORS_ORIGIN ?? ["http://localhost:51731"];
  return cors({ origin })(c, next);
});
// app.get("/assets/*", serveStatic());

app.get("/get/feed", async (c, next) => {
  console.log(c.env);
  if (c.env.FEED_FROM) {
    return c.json(await FeedSet({ url: c.env.FEED_FROM, c, minute: 10 }));
  } else return next();
});

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
      characters,
      styles: <Style href={"/css/styles.css" + version} />,
      script: <script type="module" src={"/static/js/client.js" + version} />,
      isLogin: IsLogin(c, import.meta.env.DEV),
    });
  });
});

app.all("*", async (c, next) => {
  if (!/.+\/+$/.test(c.req.path))
    return c.html(renderToString(<ServerNotFound />), { status: 404 });
  else return next();
});

app.use(trimTrailingSlash());

export default app;
