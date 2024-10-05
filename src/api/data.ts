import { Hono } from "hono";
import { cache } from "hono/cache";
import { ServerImagesGetData } from "./image";
import { MeeSqlD1 } from "@/functions/database/MeeSqlD1";
import { ServerCharactersGetData } from "./character";
import { IsLogin } from "@/admin";
import { ServerPostsGetData } from "./blog";
import { getDataWithoutPrefix } from "@/functions/stringFix";
import { ServerSoundAlbumsGetData, ServerSoundsGetData } from "./sound";
import { ServerFilesGetData } from "./file";
import { SiteFavLinkServer, SiteLinkServer } from "./links";

export const app = new Hono<MeeBindings<MeeCommonEnv>>({
  strict: false,
});

app.get("*", async (c, next) => {
  if (c.env.DEV) return next();
  const Url = new URL(c.req.url);
  const hasCacheParam = Url.searchParams.has("cache");
  if (hasCacheParam) {
    const cacheParam = Url.searchParams.get("cache") as CacheParamType;
    if (IsLogin(c)) {
      switch (cacheParam) {
        case "no-cache":
        case "no-cache-reload":
          return next();
      }
    }
    Url.searchParams.delete("cache");
  }
  if (Url.searchParams.size)
    return cache({
      cacheName: "data",
      cacheControl: "max-age=30",
    })(c, next);
  else
    return cache({
      cacheName: "data",
      cacheControl: "max-age=600",
    })(c, next);
});

function apps(
  ...list: [
    key: string,
    path: string,
    (
      searchParams: URLSearchParams,
      db: MeeSqlD1,
      isLogin?: boolean
    ) => Promise<any>
  ][]
) {
  list.forEach(([key, path, getData]) => {
    app.get(path, async (c) => {
      return c.json(
        await getData(
          new URL(c.req.url).searchParams,
          new MeeSqlD1(c.env.DB),
          IsLogin(c)
        )
      );
    });
  });
  app.get("/all", async (c) => {
    const isLogin = IsLogin(c);
    const Url = new URL(c.req.url);
    const query = Object.fromEntries(Url.searchParams);
    const db = new MeeSqlD1(c.env.DB);
    return c.json(
      Object.fromEntries(
        await Promise.all(
          list.map(async ([key, path, getData]) => [
            key,
            await getData(
              new URLSearchParams(getDataWithoutPrefix(key, query)),
              db,
              isLogin
            ),
          ])
        )
      )
    );
  });
}

apps(
  ["images", "/images", ServerImagesGetData],
  ["characters", "/characters", ServerCharactersGetData],
  ["posts", "/posts", ServerPostsGetData],
  ["sounds", "/sounds", ServerSoundsGetData],
  ["soundAlbums", "/soundAlbums", ServerSoundAlbumsGetData],
  ["files", "/files", ServerFilesGetData],
  ["links", "/links", SiteLinkServer.getData.bind(SiteLinkServer)],
  ["linksFav", "/links/fav", SiteFavLinkServer.getData.bind(SiteFavLinkServer)]
);

export const app_data_api = app;
