import { Hono } from "hono";
import { cache } from "hono/cache";
import { MeeSqlD1 } from "./functions/database/MeeSqlD1";
import { ImageTableObject } from "./api/image";
import { concatOriginUrl, getMediaOrigin } from "./functions/originUrl";

export const app = new Hono<MeeBindings<MeeCommonEnv>>();

app.get("*", async (c, next) => {
  if (import.meta.env?.DEV) return next();
  else
    return cache({
      cacheName: "get-latest-cache",
      cacheControl: "max-age=600",
    })(c, next);
});

app.get("/:target/:name", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const Url = new URL(c.req.url);
  const mediaOrigin = getMediaOrigin(
    { ...c.env, DEV: import.meta.env?.DEV },
    Url.origin,
    true
  );
  switch (c.req.param("target")) {
    case "images":
      const albumName = c.req.param("name");
      const images = await ImageTableObject.Select({
        db,
        where: {
          album: albumName,
          NOT: {
            src: null,
          },
          OR: [{ draft: null }, { draft: 0 }],
          lastmod: { lte: new Date().toISOString() },
        },
        take: 1,
        orderBy: [{ time: "desc" }],
      });
      if (images.length > 0) {
        const image = images[0];
        const blob = await fetch(concatOriginUrl(mediaOrigin, image.src!)).then(
          (r) => (r.ok ? r.blob() : null)
        );
        if (blob) {
          return c.body(await blob.arrayBuffer(), {
            headers: { "Content-Type": blob.type },
          });
        }
      }
      break;
  }
  return next();
});

export const app_get = app;
