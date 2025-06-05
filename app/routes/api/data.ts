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
    [TableVersionDataOptions, ServerTableVersionGetData],
  ];
const datasetMap = new Map(dataset.map(([options, getData]) => ([options.name, { options, getData }])));

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const env = getCfEnv({ context });
  const isLogin = IsLogin({ env, request, trueWhenDev: true });
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
