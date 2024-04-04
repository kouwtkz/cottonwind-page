import { Hono } from "hono";
import { renderToString } from "react-dom/server";
import { DefaultBody, DefaultMeta, SetMetaServerSide } from "./serverLayout";
import { buildAddVer } from "./data/env";
import { serverSite } from "./data/server/site";
import { FetchBody, XmlHeader } from "./data/functions/ServerContent";
import { serverCharacters as characters } from "./data/server/characters";
import { serverImageItemList as images } from "./data/server/images";

const app = new Hono();

// app.get("/assets/*", async (c, next) => {
//   return (await (c.env as any)?.ASSETS.fetch(c.req.raw)) ?? next();
// });

app.get("/get/rss", async (c) => {
  return c.newResponse(await FetchBody(serverSite.feedFrom), XmlHeader);
});

app.get("*", (c) => {
  return c.html(
    renderToString(
      <html>
        <head>
          <DefaultMeta />
          <SetMetaServerSide
            url={c.req.url}
            path={c.req.path}
            query={c.req.query()}
            characters={characters}
            images={images}
          />
          <script type="module" src={"/static/client.js" + buildAddVer} />
          <link rel="stylesheet" href={"/static/styles.css" + buildAddVer} />
        </head>
        <DefaultBody />
      </html>
    )
  );
});

export default app;
