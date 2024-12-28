import { Hono } from "hono";
import { renderHtml } from "./functions/render";
import {
  AddMetaEnv,
  ServerError,
  ServerNotFound,
  ServerSimpleLayout,
} from "./serverLayout";
import { RoutingList } from "./routes/RoutingList";
import SuggestPage from "./routes/SuggestPage";
import { GitLogObject } from "@/gitlog/GitlogObject";

const app = new Hono<MeePagesBindings>({ strict: true });

app.get("/env.json", async (c) => {
  const {
    DB,
    KV,
    NOTICE_FEED_KV,
    AUTHOR_EMAIL,
    DISCORD_INVITE_ANSWER,
    DISCORD_INVITE_URL,
    FEED_DEV_FROM,
    X_CLIENT_ID,
    X_CLIENT_SECRET,
    LOGIN_TOKEN,
    LIFE_CHECK_CHALLENGE,
    LIFE_CHECK_VERIFIER,
    LIFE_CHECKER_URL,
    CONTACT_FORM_GOOGLE_DEV,
    ..._env
  } = AddMetaEnv(c.env);
  const env = _env as SiteConfigEnv;
  if (import.meta.env?.DEV && CONTACT_FORM_GOOGLE_DEV)
    env.CONTACT_FORM_GOOGLE = CONTACT_FORM_GOOGLE_DEV;
  return c.json(env);
});

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
//   const sitemap = (c.env.ORIGIN ?? new URL(c.req.url).origin) + "/sitemap.xml";
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
