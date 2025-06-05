import type { AppLoadContext } from "react-router";
import type { Route } from "../+types/root";
import {
  charactersDataOptions,
  filesDataOptions,
  ImageDataOptions,
  INDEXEDDB_NAME,
  INDEXEDDB_VERSION,
  KeyValueDBDataOptions,
  likeDataOptions,
  linksDataOptions,
  linksFavDataOptions,
  postsDataOptions,
  soundAlbumsDataOptions,
  soundsDataOptions,
  TableVersionDataOptions,
} from "./DataEnv";

import {
  ImageIndexedDataStateClass,
  ImageMeeIndexedDBTable,
  IndexedDataLastmodMH,
} from "./IndexedDB/IndexedDataLastmodMH";
import { concatOriginUrl, getAPIOrigin, getMediaOrigin, type EnvWithCfOriginOptions } from "~/components/functions/originUrl";
import { MeeIndexedDB, type MeeIndexedDBTable } from "./IndexedDB/MeeIndexedDB";
import { corsFetch } from "~/components/functions/fetch";

export let waitIdbResolve: (value?: unknown) => void;
export let waitIdb = new Promise((resolve, reject) => {
  waitIdbResolve = resolve;
});

type anyIdbStateClass = IndexedDataLastmodMH<any, any, MeeIndexedDBTable<any>>;
export let IdbStateClassMap: Map<string, anyIdbStateClass> | null = null;

export let imageDataIndexed: ImageIndexedDataStateClass;
export let charactersDataIndexed: IndexedDataLastmodMH<CharacterType, CharacterDataType>;
export let postsDataIndexed: IndexedDataLastmodMH<PostType, PostDataType>;
export let soundsDataIndexed: IndexedDataLastmodMH<SoundItemType, SoundDataType>;
export let soundAlbumsDataIndexed: IndexedDataLastmodMH<SoundAlbumType, SoundAlbumDataType>;
export let filesDataIndexed: IndexedDataLastmodMH<FilesRecordType, FilesRecordDataType>;
export let linksDataIndexed: IndexedDataLastmodMH<SiteLink, SiteLinkData>;
export let favLinksDataIndexed: IndexedDataLastmodMH<SiteLink, SiteLinkData>;
export let likeDataIndexed: IndexedDataLastmodMH<LikeType, LikeDataType>;
export let keyValueDBDataIndexed: IndexedDataLastmodMH<KeyValueDBType, KeyValueDBDataType>;
export let KVDataIndexed: typeof keyValueDBDataIndexed;
export let tableVersionDataIndexed: IndexedDataLastmodMH<Props_LastmodMH_Tables, Props_LastmodMH_Tables_Data>;
export let IdbStateClassList: anyIdbStateClass[] = [];

export let dbClass: MeeIndexedDB;
export async function MeeIndexedDBCreate() {
  return MeeIndexedDB.create({
    version: INDEXEDDB_VERSION,
    dbName: INDEXEDDB_NAME,
    onupgradeneeded(e, db) {
      IdbStateClassList.map((props) => {
        props.dbUpgradeneeded(e, db);
      });
    },
    async onsuccess(db) {
      await Promise.all(
        IdbStateClassList.map(async (props) => {
          await props.dbSuccess(db);
          await props.setBeforeLastmod();
        })
      );
    },
  }).then((db) => {
    dbClass = db;
    return db;
  });
}

export let apiOrigin: string | undefined;
export let mediaOrigin: string | undefined;

async function setSearchParamsOptionUrl(Url: URL, isLoading?: LoadStateType, idb?: anyIdbStateClass) {
  function set(obj: anyIdbStateClass) {
    let prefix: string | undefined;
    if (!idb) prefix = obj.key;
    return obj.setSearchParamsOption({
      searchParams: Url.searchParams,
      loadValue: isLoading,
      prefix,
    });
  }
  if (idb) await set(idb);
  else await Promise.all(IdbStateClassList.map((obj) => set(obj)));
  return Url;
}

export async function getDataFromApi<T = any>(
  src: string,
  isLoading?: LoadStateType,
  idb?: anyIdbStateClass
) {
  let Url = new URL(concatOriginUrl(apiOrigin || location.origin, src));
  Url = await setSearchParamsOptionUrl(Url, isLoading, idb);
  const cache = IndexedDataLastmodMH.getCacheOption(isLoading);
  return await corsFetch(Url.href, {
    cache: cache !== "no-cache-reload" ? cache : undefined,
  }).then(async (r) => (await r.json()) as T);
}

const allDataSrc = "/data/all";

interface ClientDBLoaderProps {
  env: EnvWithCfOriginOptions;
}
export async function ClientDBLoader({
  env
}: ClientDBLoaderProps) {
  if (!IdbStateClassMap) {
    apiOrigin = getAPIOrigin(env, location.origin);
    mediaOrigin = getMediaOrigin(env, location.origin);
    tableVersionDataIndexed = new IndexedDataLastmodMH(
      TableVersionDataOptions
    );
    imageDataIndexed = new ImageIndexedDataStateClass(
      ImageDataOptions,
      new ImageMeeIndexedDBTable(ImageDataOptions)
    );
    charactersDataIndexed = new IndexedDataLastmodMH(
      charactersDataOptions
    );
    postsDataIndexed = new IndexedDataLastmodMH(postsDataOptions);
    soundsDataIndexed = new IndexedDataLastmodMH(soundsDataOptions);
    soundAlbumsDataIndexed = new IndexedDataLastmodMH(
      soundAlbumsDataOptions
    );
    filesDataIndexed = new IndexedDataLastmodMH(filesDataOptions);
    linksDataIndexed = new IndexedDataLastmodMH(linksDataOptions);
    favLinksDataIndexed = new IndexedDataLastmodMH(
      linksFavDataOptions
    );
    likeDataIndexed = new IndexedDataLastmodMH(likeDataOptions);
    keyValueDBDataIndexed = new IndexedDataLastmodMH(
      KeyValueDBDataOptions
    );
    KVDataIndexed = keyValueDBDataIndexed;
    IdbStateClassMap = new Map();
    (
      [
        tableVersionDataIndexed,
        imageDataIndexed,
        charactersDataIndexed,
        postsDataIndexed,
        soundsDataIndexed,
        soundAlbumsDataIndexed,
        filesDataIndexed,
        linksDataIndexed,
        favLinksDataIndexed,
        likeDataIndexed,
        keyValueDBDataIndexed,
      ] as anyIdbStateClass[]
    ).forEach((item) => {
      IdbStateClassMap!.set(item.options.name, item);
    });
    IdbStateClassList = Array.from(IdbStateClassMap.values());
    await MeeIndexedDBCreate();
  }
  await getDataFromApi<JSONAllDataTypes>(allDataSrc)
    .then(async (items) => {
      await linksDataIndexed!.save({ data: items.links });
      Promise.all(
        IdbStateClassList.map(async (obj) => {
          const data = items[obj.key as JSONAllDataKeys];
          await obj.save({ data });
        })
      )
    }).then(() => {
      waitIdbResolve();
    })
}
