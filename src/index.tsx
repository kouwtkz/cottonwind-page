import { Hono } from "hono";
import { ServerLayout, SetMetaServerSide } from "./serverLayout";
import { buildAddVer } from "./data/env";
import { serverSite } from "./data/server/site";
import { FetchBody, XmlHeader, discordInviteMatch } from "./ServerContent";
import { honoTest } from "./functions";
import { renderToString } from "react-dom/server";
import { serverCharacters as characters } from "./data/server/characters";
import { app_workers } from "./workers";

const app = new Hono();

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

// honoTest(app);

app.get("*", async (c) => {
  return c.html(
    renderToString(
      await ServerLayout({
        c,
        characters,
        meta: (
          <>
            <script type="module" src={"/static/client.js" + buildAddVer} />
            <link rel="stylesheet" href={"/static/styles.css" + buildAddVer} />
          </>
        ),
      })
    )
  );
});

export default app;
