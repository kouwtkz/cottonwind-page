import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { RoutingList } from "./routes/RoutingList";
import { ReactResponse, ServerNotFound, Style } from "./serverLayout";
import { buildAddVer, stylesAddVer } from "./data/env";
import {
  FeedSet,
  IsLogin,
} from "./ServerContent";
import { renderToString } from "react-dom/server";
import { serverCharacters as characters } from "./data/server/characters";
import { ServerCommon } from "./server";

const app = new Hono<MeeBindings>({ strict: true });

// app.get("/assets/*", serveStatic());

app.get("/get/feed", async (c, next) => {
  if (c.env.FEED_FROM) {
    return c.json(await FeedSet({ url: c.env.FEED_FROM, c, minute: 10 }));
  } else return next();
});


ServerCommon(app);

RoutingList.forEach((path) => {
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
