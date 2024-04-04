import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { renderToString } from "react-dom/server";
import { DefaultBody, DefaultMeta, SetMetaServerSide } from "./serverLayout";
import { GalleryPatch, uploadAttached } from "./mediaScripts/GalleryUpdate";
import { GetEmbed } from "./mediaScripts/GetEmbed.mjs";
import { serverSite } from "./data/server/site";
import { FetchBody, XmlHeader } from "./data/functions/ServerContent";
import { SetCharaData } from "./data/functions/SetCharaData";
// import { serverCharacters as characters } from "./data/server/characters";
// import { serverImageItemList as images } from "./data/server/images";

const app = new Hono();

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

app.get("*", (c, next) => {
  return c.html(
    renderToString(
      <html lang="ja">
        <head>
          <DefaultMeta />
          <SetMetaServerSide
            url={c.req.url}
            path={c.req.path}
            query={c.req.query()}
            // characters={characters}
            // images={images}
          />
          <link rel="stylesheet" href="/src/styles.css" />
          <script type="module" src="/src/client.tsx" />
        </head>
        <DefaultBody />
      </html>
    )
  );
});

export default app;
