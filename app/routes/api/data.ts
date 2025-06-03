import type { Route } from "./+types/data";
import { MeeSqlD1 } from "~/data/functions/MeeSqlD1";
import { IsLogin } from "~/components/utility/Admin";
import type { GetDataProps } from "./propsDef";
import { getDataWithoutPrefix } from "~/components/functions/stringFix";
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
} from "~/data/DataEnv";
import { ServerTableVersionGetData, UpdateTablesDataObject } from "./DBTablesObject";
import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import { ServerImagesGetData } from "./image";
import { ServerCharactersGetData } from "./character";
// import { ServerPostsGetData } from "./blog";
// import { ServerSoundAlbumsGetData, ServerSoundsGetData } from "./sound";
// import { ServerFilesGetData } from "./file";
// import { SiteFavLinkServer, SiteLinkServer } from "./links";
// import { ServerLikeGetData } from "./like";
// import { ServerKeyValueDBGetData } from "./KeyValueDB";

const dataset: Array<[
  options: Props_LastmodMHClass_Options<any>,
  (arg0: GetDataProps) => Promise<any>
]> = [
    [ImageDataOptions, ServerImagesGetData],
    [charactersDataOptions, ServerCharactersGetData],
    // [postsDataOptions, ServerPostsGetData],
    // [soundsDataOptions, ServerSoundsGetData],
    // [soundAlbumsDataOptions, ServerSoundAlbumsGetData],
    // [filesDataOptions, ServerFilesGetData],
    // [linksDataOptions, SiteLinkServer.getData.bind(SiteLinkServer)],
    // [linksFavDataOptions, SiteFavLinkServer.getData.bind(SiteFavLinkServer)],
    // [likeDataOptions, ServerLikeGetData],
    // [KeyValueDBDataOptions, ServerKeyValueDBGetData],
    // [TableVersionDataOptions, ServerTableVersionGetData],
  ];

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const env = getCfEnv({ context });
  switch (params.param) {
    case "image": {

    }
    case "all": {
      const isLogin = IsLogin({ env, request, trueWhenDev: true });
      const Url = new URL(request.url);
      const query = Object.fromEntries(Url.searchParams);
      const db = getCfDB({ context })!;
      if (db) {
        return Response.json(
          Object.fromEntries(
            await Promise.all(
              dataset.map(async ([{ name }, getData]) => [
                name,
                await getData(
                  {
                    searchParams: new URLSearchParams(getDataWithoutPrefix(name, query)),
                    db,
                    isLogin,
                    request
                  }
                ),
              ])
            )
          )
        );
      } else return {};
    }
  }
  return {};
}

// app.get("*", async (c, next) => {
//   if (import.meta.env?.DEV) return next();
//   const Url = new URL(request.url);
//   const hasCacheParam = Url.searchParams.has("cache");
//   if (hasCacheParam) {
//     const cacheParam = Url.searchParams.get("cache") as CacheParamType;
//     if (IsLogin(c)) {
//       switch (cacheParam) {
//         case "no-cache":
//         case "no-cache-reload":
//           return next();
//       }
//     }
//     Url.searchParams.delete("cache");
//   }
//   if (Url.searchParams.size)
//     return cache({
//       cacheName: "data",
//       cacheControl: "max-age=30",
//     })(c, next);
//   else
//     return cache({
//       cacheName: "data",
//       cacheControl: "max-age=600",
//     })(c, next);
// });


// function apps(
//   ...list: [
//     options: Props_LastmodMHClass_Options<any>,
//     (arg0: GetDataProps) => Promise<any>
//   ][]
// ) {
//   list.forEach(([{ src }, getData]) => {
//     app.get(src, async (c) => {
//       return c.json(
//         await getData({
//           searchParams: new URL(request.url).searchParams,
//           db: new MeeSqlD1(c.env.DB),
//           isLogin: IsLogin(c),
//           req: request
//         }
//         )
//       );
//     });
//   });
//   app.get("/all", async (c) => {
//     const isLogin = IsLogin(c);
//     const Url = new URL(request.url);
//     const query = Object.fromEntries(Url.searchParams);
//     const db = getCfDB({ context });;
//     return c.json(
//       Object.fromEntries(
//         await Promise.all(
//           list.map(async ([{ name }, getData]) => [
//             name,
//             await getData(
//               {
//                 searchParams: new URLSearchParams(getDataWithoutPrefix(name, query)),
//                 db,
//                 isLogin,
//                 req: request
//               }
//             ),
//           ])
//         )
//       )
//     );
//   });
// }

// apps(
//   [ImageDataOptions, ServerImagesGetData],
//   [charactersDataOptions, ServerCharactersGetData],
//   [postsDataOptions, ServerPostsGetData],
//   [soundsDataOptions, ServerSoundsGetData],
//   [soundAlbumsDataOptions, ServerSoundAlbumsGetData],
//   [filesDataOptions, ServerFilesGetData],
//   [linksDataOptions, SiteLinkServer.getData.bind(SiteLinkServer)],
//   [linksFavDataOptions, SiteFavLinkServer.getData.bind(SiteFavLinkServer)],
//   [likeDataOptions, ServerLikeGetData],
//   [KeyValueDBDataOptions, ServerKeyValueDBGetData],
//   [TableVersionDataOptions, ServerTableVersionGetData],
// );

// app.post("/tables/update", async (c) => {
//   const list: Props_LastmodMHClass_Options<any>[] = [
//     charactersDataOptions,
//     linksFavDataOptions,
//     filesDataOptions,
//     ImageDataOptions,
//     linksDataOptions,
//     postsDataOptions,
//     soundAlbumsDataOptions,
//     soundsDataOptions,
//     likeDataOptions,
//     KeyValueDBDataOptions,
//   ];
//   const db = getCfDB({ context });;
//   const lastmodTime = new Date();
//   for (const options of list) {
//     const lastmod = lastmodTime.toISOString();
//     if (options.oldServerKeys) {
//       let oldKey: string | undefined;
//       for (const table of options.oldServerKeys) {
//         if (await db.exists({ table })) { oldKey = table; break; }
//       }
//       if (oldKey) {
//         await db.renameTable({ from: oldKey, table: options.name, drop: true });
//       }
//     }
//     await UpdateTablesDataObject({ db, options, lastmod });
//     lastmodTime.setMilliseconds(lastmodTime.getMilliseconds() + 1);
//   }
//   return c.body("");
// });

// export const app_data_api = app;
