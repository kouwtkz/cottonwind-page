import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { trimTrailingSlash } from "hono/trailing-slash";
import { RoutingList } from "./routes/RoutingList";
import { DefaultReactResponse, ServerNotFound, Style } from "./serverLayout";
import { IsLogin } from "./admin";
import { honoTest } from "./functions";
import { renderHtml } from "./functions/render";
import ssg from "./ssg";
import { GitLogObject } from "@src/gitlog/GitlogObject";
import { NoIndex, MainPageRouteIndex } from "@src/index.route";
import { app_test } from "./test.dev";
import { cors } from "hono/cors";
import stylesMain from "./styles.scss";
import stylesfromLib from "./styles/styles_lib.scss";
import { appFromImportStyle } from "@src/indexFunctions";

const app = new Hono<MeePagesBindings>({ strict: true });

app.use("*", (c, next) => {
  const origin = c.env.CORS_ORIGIN ?? ["http://localhost:51731"];
  return cors({ origin })(c, next);
});

const styles: [string, unknown][] = [
  ["styles", stylesMain],
  ["styles_lib", stylesfromLib],
];
const stylePathes = appFromImportStyle({ styles, app });

honoTest(app);
MainPageRouteIndex(app);

app.get("/src/*", serveStatic({ root: "./" }));

app.get("/json/gitlog.json", (c) => {
  return c.json(GitLogObject());
});
app.get("/json/*", serveStatic({ root: "./public/" }));

app.route("/test", app_test);

app.get("/check/:bool", async (c) => {
  const bool = request.param().bool;
  await c.env.NOTICE_FEED_KV.put("life-check", bool);
  return c.text("written life-check:" + bool);
});

app.route("/", ssg);
app.post("/", async (c) => {
  return c.json(Object.fromEntries(await request.formData()));
});

RoutingList.forEach((path) => {
  app.get(path, (c, next) =>
    DefaultReactResponse({
      c,
      next,
      path,
      style: stylePathes.map((href, i) => <Style href={href} key={i} />),
      isLogin: IsLogin(c),
      noindex: NoIndex(path),
    })
  );
});

app.all("*", async (c, next) => {
  if (!/.+\/+$/.test(request.path))
    return c.html(renderHtml(<ServerNotFound />), { status: 404 });
  else return next();
});

app.use(trimTrailingSlash());

export default app;
