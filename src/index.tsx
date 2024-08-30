import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { RoutingList } from "./routes/RoutingList";
import { ReactResponse, ServerNotFound, Style } from "./serverLayout";
import { buildAddVer, stylesAddVer } from "./data/env";
import { FeedSet, IsLogin } from "./ServerContent";
import { renderToString } from "react-dom/server";
import { serverCharacters as characters } from "./data/server/characters";
import { ServerCommon } from "./server";

const app = new Hono<MeePagesBindings>({ strict: true });

// app.get("/assets/*", serveStatic());

app.get("/get/feed", async (c, next) => {
  if (c.env.FEED_FROM) {
    return c.json(await FeedSet({ url: c.env.FEED_FROM, c, minute: 10 }));
  } else return next();
});

ServerCommon(app);

RoutingList.forEach((path) => {
  app.get(path, async (c, next) => {
    if (
      c.req.url.startsWith(c.env.PAGES_DEV_URL ?? "") &&
      (await c.env.NOTICE_FEED_KV.get("life-check")) !== "false"
    ) {
      const Url = new URL(c.req.url);
      const redirectUrl = new URL(import.meta.env.VITE_URL);
      redirectUrl.pathname = Url.pathname;
      redirectUrl.search = Url.search;
      redirectUrl.hash = Url.hash;
      return c.redirect(redirectUrl.href);
    }
    return next();
  });
  app.get(path, (c, next) =>
    ReactResponse({
      c,
      next,
      path,
      characters,
      styles: <Style href={"/css/styles.css" + stylesAddVer} />,
      script: (
        <script type="module" src={"/static/js/client.js" + buildAddVer} />
      ),
      isLogin: IsLogin(c),
    })
  );
});

app.all("*", async (c, next) => {
  if (!/.+\/+$/.test(c.req.path))
    return c.html(renderToString(<ServerNotFound />), { status: 404 });
  else return next();
});

app.use(trimTrailingSlash());

export default app;
