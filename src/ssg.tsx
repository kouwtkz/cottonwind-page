import { Hono } from "hono";
import { renderToString } from "react-dom/server";
import {
  ServerError,
  ServerNotFound,
  ServerSimpleLayout,
} from "./serverLayout";
import { RoutingList } from "@/routes/RoutingList";
import SuggestPage from "./routes/SuggestPage";
import { GitLogObject } from "@/data/functions/GitlogObject";

const app = new Hono<MeeBindings>({ strict: true });

app.get("/404", async (c) => {
  return c.html(renderToString(<ServerNotFound />), { status: 404 });
});

app.get("/500", async (c) => {
  return c.html(renderToString(<ServerError />), { status: 500 });
});

app.get("/suggest", async (c) => {
  return c.html(
    renderToString(
      <ServerSimpleLayout
        noindex={true}
        title={"ていあん | " + import.meta.env.VITE_TITLE}
      >
        <SuggestPage />
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

export default app;
