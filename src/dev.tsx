import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { renderToString } from "react-dom/server";
import { DefaultBody, DefaultMeta, SetMetaServerSide } from "./serverLayout";
import { GalleryPatch, uploadAttached } from "./mediaScripts/GalleryUpdate";
import { GetEmbed } from "./mediaScripts/GetEmbed.mjs";

const app = new Hono();

app.get("/rss", async (c) => {
  const feed = await fetch(
    "https://bsky.app/profile/did:plc:27df3xmlj52mumyihflzh4vr/rss"
  );
  return c.newResponse(feed.body, {
    headers: { "Content-Type": "application/xml; charset=UTF-8" },
  });
});

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
app.patch("/gallery/send", async (c, next) => {
  await GalleryPatch(await c.req.json());
  return c.newResponse(null);
});

app.get("/embed/get", async (c, next) => {
  return c.json(GetEmbed());
});

app.get("*", (c, next) => {
  return c.html(
    renderToString(
      <html lang="ja">
        <head>
          <DefaultMeta />
          <SetMetaServerSide path={c.req.path} query={c.req.query()} />
          <link rel="stylesheet" href="/src/styles.css" />
          <script type="module" src="/src/client.tsx" />
        </head>
        <DefaultBody />
      </html>
    )
  );
});

export default app;
