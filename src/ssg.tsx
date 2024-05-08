import { Hono } from "hono";
import { renderToString } from "react-dom/server";
import { ServerNotFound } from "./serverLayout";
import { RoutingList } from "@/routes/RoutingList";

const app = new Hono({ strict: true });

app.get("/404", async (c) => {
  return c.html(renderToString(<ServerNotFound />), { status: 404 });
});

app.get("_routes.json", (c) => {
  const exclude = [
    "/favicon.ico",
    "/404",
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
  const wc = include.filter((v) => /\*/.test(v));
  include = include.filter(
    (v) => v === "/" || wc.some((w) => w === v) || !wc.some((w) => v.match(w))
  );
  const json = {
    version: 1,
    include,
    exclude,
  };
  return c.json(json);
});

export default app;
