import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { trimTrailingSlash } from "hono/trailing-slash";
import { RoutingList } from "./routes/RoutingList";
import { ReactResponse, ServerNotFound, Style } from "./serverLayout";
import { IsLogin } from "./admin";
import { honoTest } from "./functions";
import { renderHtml } from "./functions/render";
import { CompactCode } from "@/functions/doc/StrFunctions";
import ssg from "./ssg";
import { GitLogObject } from "@/gitlog/GitlogObject";
import { NoIndex, ServerCommon } from "./server";
import { app_test } from "./test.dev";
import { cors } from "hono/cors";
import styles from "./styles.scss";
import stylesfromLib from "./styles/styles_lib.scss";
import mediaApp from "./media";
import { DefaultImportScripts } from "./clientScripts";

const app = new Hono<MeePagesBindings>({ strict: true });

app.use("*", (c, next) => {
  const origin = c.env.CORS_ORIGIN ?? ["http://localhost:51731"];
  return cors({ origin })(c, next);
});

const styleList = [
  ["styles", styles],
  ["styles_lib", stylesfromLib],
];
const stylePathes: string[] = [];
for (const [name, code] of styleList) {
  const path = `/css/${name}.css`;
  stylePathes.push(path);
  const compactStyles = CompactCode(code);
  app.get(path, (c) =>
    c.body(compactStyles, { headers: { "Content-Type": "text/css" } })
  );
}

honoTest(app);
ServerCommon(app);

app.get("/src/*", serveStatic({ root: "./" }));
app.route("/media/", mediaApp);

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
      styles: stylePathes.map((href, i) => <Style href={href} key={i} />),
      script: (
        <>
          <script type="module" src="/src/client.tsx" />
          <DefaultImportScripts />
        </>
      ),
      isLogin: IsLogin(c),
      noindex: NoIndex(path),
    })
  );
});

app.all("*", async (c, next) => {
  if (!/.+\/+$/.test(c.req.path))
    return c.html(renderHtml(<ServerNotFound />), { status: 404 });
  else return next();
});

app.use(trimTrailingSlash());

export default app;
