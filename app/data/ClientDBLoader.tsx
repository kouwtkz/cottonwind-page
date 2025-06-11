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
  type TableNameTypes,
  type TableNameTypesWithAll,
} from "./DataEnv";

import {
  ImageIndexedDataStateClass,
  ImageMeeIndexedDBTable,
  IndexedDataLastmodMH,
} from "./IndexedDB/IndexedDataLastmodMH";
import {
  concatOriginUrl,
  getAPIOrigin,
  getMediaOrigin,
  type EnvWithCfOriginOptions,
} from "~/components/functions/originUrl";
import { MeeIndexedDB, type MeeIndexedDBTable } from "./IndexedDB/MeeIndexedDB";
import { customFetch } from "~/components/functions/fetch";
import { useCallback, useEffect, useSyncExternalStore } from "react";

export let waitIdbResolve: (value?: unknown) => void;
export let waitIdb = new Promise((resolve, reject) => {
  waitIdbResolve = resolve;
});

type anyIdbStateClass = IndexedDataLastmodMH<any, any, MeeIndexedDBTable<any>>;
export let IdbStateClassMap: Map<string, anyIdbStateClass> | null = null;

export let imageDataIndexed: ImageIndexedDataStateClass;
export let charactersDataIndexed: IndexedDataLastmodMH<
  CharacterType,
  CharacterDataType
>;
export let postsDataIndexed: IndexedDataLastmodMH<PostType, PostDataType>;
export let soundsDataIndexed: IndexedDataLastmodMH<
  SoundItemType,
  SoundDataType
>;
export let soundAlbumsDataIndexed: IndexedDataLastmodMH<
  SoundAlbumType,
  SoundAlbumDataType
>;
export let filesDataIndexed: IndexedDataLastmodMH<
  FilesRecordType,
  FilesRecordDataType
>;
export let linksDataIndexed: IndexedDataLastmodMH<SiteLink, SiteLinkData>;
export let favLinksDataIndexed: IndexedDataLastmodMH<SiteLink, SiteLinkData>;
export let likeDataIndexed: IndexedDataLastmodMH<LikeType, LikeDataType>;
export let keyValueDBDataIndexed: IndexedDataLastmodMH<
  KeyValueDBType,
  KeyValueDBDataType
>;
export let KVDataIndexed: typeof keyValueDBDataIndexed;
export let tableVersionDataIndexed: IndexedDataLastmodMH<
  Props_LastmodMH_Tables,
  Props_LastmodMH_Tables_Data
>;
export let IdbStateClassList: anyIdbStateClass[] = [];
export const IdbClassMap: Map<TableNameTypes, anyIdbStateClass> = new Map();
export const IdbLoadMap: Map<TableNameTypesWithAll, LoadStateType> = new Map();

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

let indexedList: anyIdbStateClass[] | null = null;

export let apiOrigin: string | undefined;
export let mediaOrigin: string | undefined;

async function setSearchParamsOptionUrl(
  Url: URL,
  isLoading?: LoadStateType,
  idb?: anyIdbStateClass
) {
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

const allDataSrc = "/data/all";

export async function getDataFromApi<T = any>(
  src: string,
  isLoading?: LoadStateType,
  idb?: anyIdbStateClass
) {
  let Url = new URL(concatOriginUrl(apiOrigin || location.origin, src));
  Url = await setSearchParamsOptionUrl(Url, isLoading, idb);
  const cache = IndexedDataLastmodMH.getCacheOption(isLoading);
  return await customFetch(Url.href, {
    cache: cache !== "no-cache-reload" ? cache : undefined,
    cors: true,
  }).then(async (r) => (await r.json()) as T);
}

interface ClientDBLoaderProps {
  env: EnvWithCfOriginOptions;
}
export async function clientDBLoader({ env }: ClientDBLoaderProps) {
  if (!IdbStateClassMap) {
    apiOrigin = getAPIOrigin(env, location.origin);
    mediaOrigin = getMediaOrigin(env, location.origin);
    tableVersionDataIndexed = new IndexedDataLastmodMH(TableVersionDataOptions);
    imageDataIndexed = new ImageIndexedDataStateClass(
      ImageDataOptions,
      new ImageMeeIndexedDBTable(ImageDataOptions)
    );
    charactersDataIndexed = new IndexedDataLastmodMH(charactersDataOptions);
    postsDataIndexed = new IndexedDataLastmodMH(postsDataOptions);
    soundsDataIndexed = new IndexedDataLastmodMH(soundsDataOptions);
    soundAlbumsDataIndexed = new IndexedDataLastmodMH(soundAlbumsDataOptions);
    filesDataIndexed = new IndexedDataLastmodMH(filesDataOptions);
    linksDataIndexed = new IndexedDataLastmodMH(linksDataOptions);
    favLinksDataIndexed = new IndexedDataLastmodMH(linksFavDataOptions);
    likeDataIndexed = new IndexedDataLastmodMH(likeDataOptions);
    keyValueDBDataIndexed = new IndexedDataLastmodMH(KeyValueDBDataOptions);
    KVDataIndexed = keyValueDBDataIndexed;
    IdbStateClassMap = new Map();
    indexedList = [
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
    ];
    indexedList.forEach((item) => {
      IdbStateClassMap!.set(item.options.name, item);
    });
    IdbStateClassList = Array.from(IdbStateClassMap.values());
    await MeeIndexedDBCreate();
    IdbStateClassList.forEach((item) => {
      IdbClassMap.set(item.key as TableNameTypes, item);
    });
    IdbLoadMap.set("all", true);
  }
  IdbLoadMap.forEach((load, key) => {
    if (!load) IdbLoadMap.delete(key);
  });
  if (IdbLoadMap.size > 0) {
    const allLoadState = IdbLoadMap.get("all");
    let results: Promise<Partial<JSONAllDataTypes>>;
    if (allLoadState) {
      results = getDataFromApi<JSONAllDataTypes>(allDataSrc, allLoadState);
    } else {
      results = Promise.all(
        Array.from(IdbLoadMap).map(async ([k, v]) => {
          const key = k as TableNameTypes;
          const idb = IdbClassMap.get(key);
          return { key, result: await getDataFromApi<any>(idb!.src, v) };
        })
      ).then((v) =>
        v.reduce<Partial<JSONAllDataTypes>>((a, { key, result }) => {
          a[key] = result;
          return a;
        }, {})
      );
    }
    IdbLoadMap.clear();
    await results
      .then(async (items) => {
        Promise.all(
          IdbStateClassList.map(async (obj) => {
            const data = items[obj.key as JSONAllDataKeys] as any;
            await obj.save({ data });
          })
        );
      })
      .then(async () => {
        const currentVersionMap = new Map(
          (
            await tableVersionDataIndexed?.table.find({
              where: { key: { not: "tables" } },
            })
          ).map((v) => [v.key, v])
        );
        indexedList!.forEach((indexedItem) => {
          const currentTable = currentVersionMap.get(indexedItem.key);
          if (currentTable) {
            indexedItem.version = currentTable?.version;
          }
        });
      })
      .then(() => {
        waitIdbResolve();
      });
  }
}

export function ClientDBState() {
  const Effect = useCallback(
    ({
      obj,
    }: {
      obj: IndexedDataLastmodMH<any, any, MeeIndexedDBTable<any>>;
    }) => {
      const isSoloLoad = useSyncExternalStore(
        obj.subscribeToLoad,
        () => obj.isLoad
      );
      useEffect(() => {
        if (isSoloLoad) {
          getDataFromApi<any[]>(obj.src, isSoloLoad, obj).then((items) => {
            obj.save({ data: items });
          });
        }
      }, [isSoloLoad]);
      const data = useSyncExternalStore(obj.subscribe, () => obj.table);
      useEffect(() => {
        obj.load(false);
      }, [data]);
      return <></>;
    },
    []
  );
  return (
    <>
      {IdbStateClassList.map((obj, i) => (
        <Effect obj={obj} key={i} />
      ))}
    </>
  );
}
