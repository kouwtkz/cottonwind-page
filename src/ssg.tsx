import { Hono } from "hono";
import { renderHtml } from "./functions/render";
import {
  ServerError,
  ServerNotFound,
  ServerSimpleLayout,
} from "./serverLayout";
import { RoutingList } from "./routes/RoutingList";
import SuggestPage from "./routes/SuggestPage";
import { GitLogObject } from "@src/gitlog/GitlogObject";

const app = new Hono<MeePagesBindings>({ strict: true });

app.get("/404", async (c) => {
  let rd = "";
  let err = "";
  try {
    rd = renderHtml(<ServerNotFound env={c.env} />);
  } catch (e) {
    err = String(e);
    console.log(e);
  }
  return c.html(err || rd, { status: 404 });
});

app.get("/500", async (c) => {
  return c.html(renderHtml(<ServerError env={c.env} />), { status: 500 });
});

app.get("/suggest", async (c) => {
  return c.html(
    renderHtml(
      <ServerSimpleLayout
        noindex={true}
        title={"ていあん | " + c.env.TITLE}
        env={c.env}
      >
        <SuggestPage env={c.env} />
      </ServerSimpleLayout>
    )
  );
});

app.get("/json/gitlog.json", (c) => {
  return c.json(GitLogObject());
});

// app.get("robots.txt", (c) => {
//   const AccessList = [
//     {
//       "User-agent": "*",
//       Allow: "/",
//     },
//   ] as { [k: string]: string }[];
//   const sitemap = (c.env.ORIGIN ?? new URL(request.url).origin) + "/sitemap.xml";
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

const mode = import.meta.env?.MODE;
const ssg_full = "ssg-full";

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
  let include = [
    "/get/*",
    "/workers/*",
    "/fetch/*",
    "/api/*",
    "/blog/*",
    "/env.json",
  ];
  if (mode !== ssg_full) include.push("/media/*");

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
