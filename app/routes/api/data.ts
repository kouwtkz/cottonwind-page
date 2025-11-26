import type { Route } from "./+types/data";
import { MeeSqlD1 } from "~/data/functions/MeeSqlD1";
import { IsLogin } from "~/components/utils/Admin";
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
  redirectDataOptions,
} from "~/data/DataEnv";
import { ServerTableVersionGetData, UpdateTablesDataObject } from "./DBTablesObject";
import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import { ServerImagesGetData } from "./image";
import { ServerCharactersGetData } from "./character";
import { ServerPostsGetData } from "./blog";
import { ServerSoundsGetData } from "./sound";
import { ServerSoundAlbumsGetData } from "./soundAlbum";
import { ServerFilesGetData } from "./file";
import { SiteLinkServer } from "./links";
import { SiteFavLinkServer } from "./links-fav";
import { ServerLikeGetData } from "./like";
import { ServerKeyValueDBGetData } from "./KeyValueDB";
import { ServerRedirectGetData } from "./redirect";

const dataset: Array<[
  options: Props_LastmodMHClass_Options<any>,
  (arg0: GetDataProps) => Promise<any>
]> = [
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
    [redirectDataOptions, ServerRedirectGetData],
    [TableVersionDataOptions, ServerTableVersionGetData],
  ];
const datasetMap = new Map(dataset.map(([options, getData]) => ([options.name, { options, getData }])));

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const env = getCfEnv({ context });
  const isLogin = await IsLogin({ env, request, trueWhenDev: false });
  if (params.param === "all") {
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
  } else {
    const object = datasetMap.get(params.param);
    const db = getCfDB({ context })!;
    if (object && db) {
      return await object.getData({
        searchParams: new URL(request.url).searchParams,
        db,
        isLogin,
        request
      });
    }
  }
  return {};
}

export async function action({ params, request, context }: Route.ActionArgs) {
  if (params.param === "update") {
    console.log(request)
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
      redirectDataOptions,
    ];
    const db = getCfDB({ context })!;
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
    return new Response();
  }
}