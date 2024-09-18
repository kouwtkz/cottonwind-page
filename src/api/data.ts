import { Hono } from "hono";
import { cache } from "hono/cache";
import { ServerImagesGetData } from "./image";
import { MeeSqlD1 } from "@/functions/MeeSqlD1";
import { ServerCharactersGetData } from "./character";
import { IsLogin } from "@/admin";
import { ServerPostsGetData } from "./blog";
import { getDataWithoutPrefix } from "@/functions/stringFix";
import { ServerSoundAlbumsGetData, ServerSoundsGetData } from "./sound";
import { ServerFilesGetData } from "./file";

export const app = new Hono<MeeBindings<MeeAPIEnv>>({
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

app.get("/images", async (c) => {
  return c.json(
    await ServerImagesGetData(
      new URL(c.req.url).searchParams,
      new MeeSqlD1(c.env.DB),
      IsLogin(c)
    )
  );
});

app.get("/characters", async (c) => {
  return c.json(
    await ServerCharactersGetData(
      new URL(c.req.url).searchParams,
      new MeeSqlD1(c.env.DB),
      IsLogin(c)
    )
  );
});

app.get("/posts", async (c) => {
  return c.json(
    await ServerPostsGetData(
      new URL(c.req.url).searchParams,
      new MeeSqlD1(c.env.DB),
      IsLogin(c)
    )
  );
});

app.get("/sounds", async (c) => {
  return c.json(
    await ServerSoundsGetData(
      new URL(c.req.url).searchParams,
      new MeeSqlD1(c.env.DB),
      IsLogin(c)
    )
  );
});

app.get("/soundAlbums", async (c) => {
  return c.json(
    await ServerSoundAlbumsGetData(
      new URL(c.req.url).searchParams,
      new MeeSqlD1(c.env.DB),
      IsLogin(c)
    )
  );
});

app.get("/files", async (c) => {
  return c.json(
    await ServerFilesGetData(
      new URL(c.req.url).searchParams,
      new MeeSqlD1(c.env.DB),
      IsLogin(c)
    )
  );
});

app.get("/all", async (c) => {
  const isLogin = IsLogin(c);
  const Url = new URL(c.req.url);
  const query = Object.fromEntries(Url.searchParams);
  const db = new MeeSqlD1(c.env.DB);
  return c.json({
    images: await ServerImagesGetData(new URLSearchParams(getDataWithoutPrefix("images", query)), db, isLogin),
    characters: await ServerCharactersGetData(new URLSearchParams(getDataWithoutPrefix("characters", query)), db, isLogin),
    posts: await ServerPostsGetData(new URLSearchParams(getDataWithoutPrefix("posts", query)), db, isLogin),
    sounds: await ServerSoundsGetData(new URLSearchParams(getDataWithoutPrefix("sounds", query)), db, isLogin),
    soundAlbums: await ServerSoundAlbumsGetData(new URLSearchParams(getDataWithoutPrefix("soundAlbums", query)), db, isLogin),
    files: await ServerFilesGetData(new URLSearchParams(getDataWithoutPrefix("files", query)), db, isLogin),
  });
});

export const app_data_api = app;
