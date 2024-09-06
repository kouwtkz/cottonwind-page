import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { trimTrailingSlash } from "hono/trailing-slash";
import { RoutingList } from "./routes/RoutingList";
import { ReactResponse, ServerNotFound, Style } from "./serverLayout";
import { IsLogin } from "./ServerContent";
import { honoTest } from "./functions";
import { renderToString } from "react-dom/server";
import { CompactCode } from "@/functions/doc/StrFunctions";
import importStyles from "@/styles.scss";
import ssg from "./ssg";
import { GitLogObject } from "@/data/functions/GitlogObject";

import { ServerCommon } from "./server";
import { app_test } from "./test.dev";
import { cors } from "hono/cors";

const compactStyles = CompactCode(importStyles);

const app = new Hono<MeePagesBindings>({ strict: true });

app.use("*", (c, next) => {
  const origin = c.env.CORS_ORIGIN ?? ["http://localhost:51731"];
  return cors({ origin })(c, next);
});

const stylePath = "/css/styles.css";
app.get(stylePath, (c) =>
  c.body(compactStyles, { headers: { "Content-Type": "text/css" } })
);

honoTest(app);
ServerCommon(app);

app.get("/src/*", serveStatic({ root: "./" }));
app.get("/_data/*", serveStatic({ root: "./" }));

app.get("/json/gitlog.json", (c) => {
  return c.json(GitLogObject());
});
app.get("/json/*", serveStatic({ root: "./public/" }));

app.route("/test", app_test);

app.get("/check/:bool", async (c) => {
  const bool = c.req.param().bool;
  await c.env.NOTICE_FEED_KV.put("life-check", bool);
  return c.text("written life-check:" + bool);
});

app.route("/", ssg);
app.post("/", async (c) => {
  return c.json(Object.fromEntries(await c.req.formData()));
});

RoutingList.forEach((path) => {
  app.get(path, (c, next) =>
    ReactResponse({
      c,
      next,
      path,
      styles: <Style href={stylePath} />,
      script: <script type="module" src="/src/client.tsx" />,
      isLogin: IsLogin(c, import.meta.env?.DEV),
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
