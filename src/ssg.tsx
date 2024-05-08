import { Hono } from "hono";
import { renderToString } from "react-dom/server";
import {
  ServerError,
  ServerNotFound,
  ServerSimpleLayout,
} from "./serverLayout";
import { RoutingList } from "@/routes/RoutingList";
import SuggestPage from "./routes/SuggestPage";

const app = new Hono({ strict: true });

app.get("/404", async (c) => {
  return c.html(renderToString(<ServerNotFound />), { status: 404 });
});

app.get("/500", async (c) => {
  return c.html(renderToString(<ServerError />), { status: 500 });
});

app.get("/suggest", async (c) => {
  return c.html(
    renderToString(
      <ServerSimpleLayout noindex={true}>
        <SuggestPage />
      </ServerSimpleLayout>
    )
  );
});

app.get("_routes.json", (c) => {
  const exclude = [
    "/favicon.ico",
    "/404",
    "/suggest",
    "/css/*",
    "/static/*",
    "/sitemap.xml",
    "/robots.txt",
  ];
  let include = ["/get/*", "/workers/*", "/fetch/*", "/api/*"];
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
