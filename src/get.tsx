import { Hono } from "hono";
import { cache } from "hono/cache";
import { MeeSqlD1 } from "@src/data/functions/MeeSqlD1";
import { ImageTableObject } from "./api/image";
import { concatOriginUrl, getMediaOrigin } from "./functions/originUrl";
import { ArrayEnv } from "@src/Env";

export const app = new Hono<MeeBindings<MeeCommonEnv>>();

app.get("*", async (c, next) => {
  if (import.meta.env?.DEV) return next();
  else
    return cache({
      cacheName: "get-latest-cache",
      cacheControl: "max-age=1800",
    })(c, next);
});

app.get("/:target/:name", async (c, next) => {
  const db = getCfDB({ context });;
  const Url = new URL(request.url);
  const mediaOrigin = getMediaOrigin(
    { ...c.env, DEV: import.meta.env?.DEV },
    Url.origin,
    true
  );
  switch (request.param("target")) {
    case "images":
      const albumName = request.param("name");
      if (
        ArrayEnv.IMAGE_ALBUMS?.some(
          (album) => album.name === albumName && album.latest
        )
      ) {
        const images = await ImageTableObject.Select({
          db,
          where: {
            AND: [
              {
                album: albumName,
              },
              {
                OR: [
                  { src: { endsWith: ".png" } },
                  { src: { endsWith: ".jp%g" } },
                ],
              },
              { lastmod: { lte: new Date().toISOString() } },
              {
                OR: [{ draft: null }, { draft: 0 }],
              },
            ],
          },
          take: 1,
          orderBy: [{ time: "desc" }],
        });
        if (images.length > 0) {
          const image = images[0];
          const blob = await fetch(
            concatOriginUrl(mediaOrigin, image.src!)
          ).then((r) => (r.ok ? r.blob() : null));
          if (blob) {
            const link = new URL(Url);
            link.pathname = "gallery";
            link.searchParams.set("image", image.key);
            link.searchParams.set("album", albumName);
            return c.body(await blob.arrayBuffer(), {
              headers: { "Content-Type": blob.type, "Link-To": link.href },
            });
          }
        }
      }
      break;
  }
  return next();
});

export const app_get = app;
