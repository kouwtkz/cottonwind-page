import { Hono } from "hono";
import { cache } from "hono/cache";
import { ServerImagesGetData } from "./image";
import { MeeSqlD1 } from "@src/data/functions/MeeSqlD1";
import { ServerCharactersGetData } from "./character";
import { IsLogin } from "@src/admin";
import { ServerPostsGetData } from "./blog";
import { getDataWithoutPrefix } from "@src/functions/stringFix";
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
  likeDataOptions,
  KeyValueDBDataOptions,
} from "@src/data/DataEnv";
import { ServerTableVersionGetData, UpdateTablesDataObject } from "./DBTablesObject";
import { ServerLikeGetData } from "./like";
import { GetDataProps } from "./propsDef";
import { ServerKeyValueDBGetData } from "./KeyValueDB";

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
    options: Props_LastmodMHClass_Options<any>,
    (arg0: GetDataProps) => Promise<any>
  ][]
) {
  list.forEach(([{ src }, getData]) => {
    app.get(src, async (c) => {
      return c.json(
        await getData({
          searchParams: new URL(c.req.url).searchParams,
          db: new MeeSqlD1(c.env.DB),
          isLogin: IsLogin(c),
          req: c.req
        }
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
          list.map(async ([{ name }, getData]) => [
            name,
            await getData(
              {
                searchParams: new URLSearchParams(getDataWithoutPrefix(name, query)),
                db,
                isLogin,
                req: c.req
              }
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
  [likeDataOptions, ServerLikeGetData],
  [KeyValueDBDataOptions, ServerKeyValueDBGetData],
  [TableVersionDataOptions, ServerTableVersionGetData],
);

app.post("/tables/update", async (c) => {
  const list: Props_LastmodMHClass_Options<any>[] = [
    charactersDataOptions,
    linksFavDataOptions,
    filesDataOptions,
    ImageDataOptions,
    linksDataOptions,
    postsDataOptions,
    soundAlbumsDataOptions,
    soundsDataOptions,
    likeDataOptions,
    KeyValueDBDataOptions,
  ];
  const db = new MeeSqlD1(c.env.DB);
  const lastmodTime = new Date();
  for (const options of list) {
    const lastmod = lastmodTime.toISOString();
    if (options.oldServerKeys) {
      let oldKey: string | undefined;
      for (const table of options.oldServerKeys) {
        if (await db.exists({ table })) { oldKey = table; break; }
      }
      if (oldKey) {
        await db.renameTable({ from: oldKey, table: options.name, drop: true });
      }
    }
    await UpdateTablesDataObject({ db, options, lastmod });
    lastmodTime.setMilliseconds(lastmodTime.getMilliseconds() + 1);
  }
  return c.body("");
});

export const app_data_api = app;
