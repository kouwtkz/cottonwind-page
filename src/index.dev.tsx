import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { trimTrailingSlash } from "hono/trailing-slash";
import { CommonContext } from "./types/HonoCustomType";
import { RoutingList } from "./routes/RoutingList";
import { ServerLayout, Style } from "./serverLayout";
import { GalleryPatch, uploadAttached } from "./mediaScripts/GalleryUpdate";
import { GetEmbed } from "./mediaScripts/GetEmbed.mjs";
import { serverSite } from "./data/server/site";
import { FetchBody, XmlHeader, discordInviteMatch } from "./ServerContent";
import { SetCharaData } from "./data/functions/SetCharaData";
import { honoTest } from "./functions";
import { renderToString } from "react-dom/server";
import { app_workers } from "./workers";
import { CompactCode } from "./components/doc/StrFunctions.mjs";
import importStyles from "@/styles.scss";
const compactStyles = CompactCode(importStyles);

const app = new Hono({ strict: true });

const stylePath = "/styles.scss";
app.get(stylePath, (c) => c.body(compactStyles));
honoTest(app);

if (serverSite.feedDev)
  app.get("/get/rss", async (c) => {
    return c.newResponse(await FetchBody(serverSite.feedDev), XmlHeader);
  });
else app.get("/get/rss", serveStatic({ path: "./_data/test/rss.xml" }));

app.get("/src/*", serveStatic({ root: "./" }));
app.get("/_data/*", serveStatic({ root: "./" }));

app.post("/gallery/send", async (c, next) => {
  const formData = await c.req.parseBody();
  await uploadAttached({
    attached: formData["attached[]"] as File[],
    attached_mtime: (formData["attached_mtime[]"] ?? []) as string[],
    tags: (formData["tags[]"] ?? []) as string[],
    uploadDir: (formData["dir"] ?? "images/uploads") as string,
  });
  return c.newResponse(null);
});
app.patch("/gallery/send", async (c) => {
  await GalleryPatch(await c.req.json());
  return c.newResponse(null);
});
app.patch("/gallery/send", async (c) => {
  await GalleryPatch(await c.req.json());
  return c.newResponse(null);
});
app.post("/character/send", async (c) => {
  return c.json(await SetCharaData(await c.req.formData()));
});

app.get("/embed/get", async (c) => {
  return c.json(GetEmbed());
});

app.get("/discord/invite/fetch", async (c) => {
  return discordInviteMatch(c);
});

app.get("/test", async (c) => {
  console.log(c.req.header("cf-connecting-ip"));
  return c.json((c.req.raw as any).cf);
});

app.route("/workers", app_workers);

async function ReactHtml(c: CommonContext) {
  return renderToString(
    await ServerLayout({
      c,
      styles: <Style href={stylePath} />,
      script: <script type="module" src="/src/client.tsx" />,
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