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
import {
  charactersDataOptions,
  linksFavDataOptions,
  filesDataOptions,
  ImageDataOptions,
  linksDataOptions,
  postsDataOptions,
  soundAlbumsDataOptions,
  soundsDataOptions,
  TableVersionDataOptions,
} from "@/dataDef";
import { ServerTableVersionGetData, UpdateTablesDataObject } from "./DBTablesObject";

export const app = new Hono<MeeBindings<MeeCommonEnv>>({
  strict: false,
});

app.get("*", async (c, next) => {
  if (import.meta.env?.DEV) return next();
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
    options: StorageDataStateClassProps<any>,
    (
      searchParams: URLSearchParams,
      db: MeeSqlD1,
      isLogin?: boolean
    ) => Promise<any>
  ][]
) {
  list.forEach(([{ src }, getData]) => {
    app.get(src, async (c) => {
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
          list.map(async ([{ key }, getData]) => [
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
  [ImageDataOptions, ServerImagesGetData],
  [charactersDataOptions, ServerCharactersGetData],
  [postsDataOptions, ServerPostsGetData],
  [soundsDataOptions, ServerSoundsGetData],
  [soundAlbumsDataOptions, ServerSoundAlbumsGetData],
  [filesDataOptions, ServerFilesGetData],
  [linksDataOptions, SiteLinkServer.getData.bind(SiteLinkServer)],
  [linksFavDataOptions, SiteFavLinkServer.getData.bind(SiteFavLinkServer)],
  [TableVersionDataOptions, ServerTableVersionGetData],
);

app.post("/tables/update", async (c) => {
  const list: StorageDataStateClassProps<any>[] = [
    charactersDataOptions,
    linksFavDataOptions,
    filesDataOptions,
    ImageDataOptions,
    linksDataOptions,
    postsDataOptions,
    soundAlbumsDataOptions,
    soundsDataOptions,
  ];
  const db = new MeeSqlD1(c.env.DB);
  const lastmod = new Date().toISOString();
  for (const options of list) {
    if (options.oldServerKeys) {
      let oldKey: string | undefined;
      for (const table of options.oldServerKeys) {
        if (await db.exists({ table })) { oldKey = table; break; }
      }
      if (oldKey) {
        await db.renameTable({ from: oldKey, table: options.key, drop: true });
      }
    }
    await UpdateTablesDataObject({ db, options, lastmod });
  }
  return c.body("");
});

export const app_data_api = app;
