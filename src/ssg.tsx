import { Hono } from "hono";
import { renderToString } from "react-dom/server";
import {
  ServerError,
  ServerNotFound,
  ServerSimpleLayout,
} from "./serverLayout";
import { RoutingList } from "./routes/RoutingList";
import SuggestPage from "./routes/SuggestPage";
import { GitLogObject } from "./data/functions/GitlogObject";
import ENV from "../env.json";
const { FAVORITE_LINKS } = ENV;

const app = new Hono<MeeBindings>({ strict: true });

app.get("/env.json", async (c) => {
  return c.json({
    VERSION: c.env.VERSION,
    ORIGIN: c.env.ORIGIN,
    TITLE: c.env.TITLE,
    DESCRIPTION: c.env.DESCRIPTION,
    OVERVIEW: c.env.OVERVIEW,
    ALTERNATE: c.env.ALTERNATE,
    AUTHOR_ACCOUNT: c.env.AUTHOR_ACCOUNT,
    AUTHOR_NAME: c.env.AUTHOR_NAME,
    AUTHOR_EN_NAME: c.env.AUTHOR_EN_NAME,
    AUTHOR_EN_NAME_ON_PROP: c.env.AUTHOR_EN_NAME_ON_PROP,
    AUTHOR_EN_PROP: c.env.AUTHOR_EN_PROP,
    AUTHOR_IMAGE: c.env.AUTHOR_IMAGE,
    SINCE: c.env.SINCE,
    SITE_IMAGE: c.env.SITE_IMAGE,
  } as SiteConfigEnv);
});

app.get("/404", async (c) => {
  let rd = "";
  let err = "";
  try {
    rd = renderToString(<ServerNotFound />);
  } catch (e) {
    err = String(e);
    console.log(e);
  }
  return c.html(err || rd, { status: 404 });
});

app.get("/500", async (c) => {
  return c.html(renderToString(<ServerError />), { status: 500 });
});

app.get("/data/favorite_links.json", async (c) => {
  return c.json(FAVORITE_LINKS ?? []);
});

app.get("/suggest", async (c) => {
  return c.html(
    renderToString(
      <ServerSimpleLayout noindex={true} title={"ていあん | " + c.env.TITLE}>
        <SuggestPage env={c.env} />
      </ServerSimpleLayout>
    )
  );
});

app.get("/json/gitlog.json", (c) => {
  return c.json(GitLogObject());
});

// app.get("robots.txt", (c) => {
//   const env = c.env;
//   const AccessList = [
//     {
//       "User-agent": "*",
//       Allow: "/",
//     },
//   ] as { [k: string]: string }[];
//   const sitemap = import.meta.env.VITE_URL + "/sitemap.xml";
//   return c.text(
//     AccessList.concat({ sitemap })
//       .map((v) =>
//         Object.entries(v)
//           .map(([k, v]) => `${k}: ${v}`)
//           .join("\n")
//       )
//       .join("\n\n")
//   );
// });

app.get("_routes.json", (c) => {
  const exclude = [
    "/favicon.ico",
    "/404",
    "/suggest",
    "/css/*",
    "/json/*",
    "/static/*",
    "/sitemap.xml",
    "/robots.txt",
  ];
  let include = ["/get/*", "/workers/*", "/fetch/*", "/api/*", "/blog/*"];
  const routing = RoutingList.map((v) =>
    v.replace(/\:[^\/]+/g, "*").replace(/^([^\/])/, "/$1")
  );
  include = routing.concat(include, exclude);
  if (include.some((v) => v === "/*")) {
    include = ["/*"];
  } else {
    const wc = include.filter((v) => /\*/.test(v));
    include = include.filter(
      (v) =>
        v === "/" || wc.some((w) => w === v) || wc.every((w) => !v.match(w))
    );
    if (include.length > 100) include = ["/*"];
  }
  const json = {
    version: 1,
    include,
    exclude,
  };
  return c.json(json);
});

const app_ssg = app;
export default app_ssg;
