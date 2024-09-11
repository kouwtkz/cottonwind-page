import { Hono } from "hono";
import { cache } from 'hono/cache'
import { ServerImagesGetData } from "./image";
import { MeeSqlD1 } from "@/functions/MeeSqlD1";
import { ServerCharactersGetData } from "./character";
import { IsLogin } from "@/ServerContent";
import { ServerPostsGetData } from "./blog";

export const app = new Hono<MeeBindings<MeeAPIEnv>>({
  strict: false,
});

app.get(
  "*",
  async (c, next) => {
    if (c.env.DEV) return next();
    const Url = new URL(c.req.url);
    const hasCacheParam = Url.searchParams.has("cache");
    const hasEndpointParam = Url.searchParams.has("lastmod");
    if (hasCacheParam) {
      const cacheParam = Url.searchParams.get("cache") as CacheParamType;
      if (IsLogin(c)) {
        switch (cacheParam) {
          case "no-cache":
          case "no-cache-reload":
            return next();
        }
      }
    }
    if (hasEndpointParam)
      return cache({
        cacheName: 'data',
        cacheControl: 'max-age=30',
      })(c, next);
    else
      return cache({
        cacheName: 'data',
        cacheControl: 'max-age=600',
      })(c, next);
  }
);

app.get("/images", async (c) => {
  return c.json(await ServerImagesGetData(new URL(c.req.url).searchParams, new MeeSqlD1(c.env.DB)));
});

app.get("/characters", async (c, next) => {
  return c.json(await ServerCharactersGetData(new URL(c.req.url).searchParams, new MeeSqlD1(c.env.DB)));
});

app.get("/posts", async (c, next) => {
  return c.json(await ServerPostsGetData(new URL(c.req.url).searchParams, new MeeSqlD1(c.env.DB)));
});

export const app_data_api = app;
