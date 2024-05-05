import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { CommonContext } from "./types/HonoCustomType";
import { RoutingList } from "./routes/RoutingList";
import { ServerLayout, SetMetaServerSide, Style } from "./serverLayout";
import { buildAddVer } from "./data/env";
import { serverSite } from "./data/server/site";
import { FetchBody, XmlHeader, discordInviteMatch } from "./ServerContent";
import { renderToString } from "react-dom/server";
import { serverCharacters as characters } from "./data/server/characters";
import { app_workers } from "./workers";
import { getCookie } from "hono/cookie";

const app = new Hono({ strict: true });

// app.get("/assets/*", async (c, next) => {
//   return (await (c.env as any)?.ASSETS.fetch(c.req.raw)) ?? next();
// });

app.get("/get/rss", async (c) => {
  return c.newResponse(await FetchBody(serverSite.feedFrom), XmlHeader);
});
app.get("/discord/invite/fetch", async (c) => {
  return discordInviteMatch(c);
});

app.route("/workers", app_workers);

async function ReactHtml(c: CommonContext) {
  return renderToString(
    await ServerLayout({
      c,
      characters,
      styles: <Style href={"/static/css/styles.css" + buildAddVer} />,
      script: (
        <script type="module" src={"/static/js/client.js" + buildAddVer} />
      ),
      isLogin:
        c.env &&
        "CF_Authorization" in c.env &&
        c.env.LOGIN_TOKEN === getCookie(c, "LoginToken"),
    })
  );
}

RoutingList.forEach((path) => {
  app.get(path, (c) => c.html(ReactHtml(c)));
});
app.get("*", async (c, next) => {
  const Url = new URL(c.req.url);
  if (!/.+\/+$/.test(Url.pathname))
    return c.html(ReactHtml(c), { status: 404 });
  else return next();
});
app.use(trimTrailingSlash());

export default app;
