import { useApiOrigin } from "@/state/EnvState";
import React, {
  SetStateAction,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";
import { jsonFileDialog } from "@/components/FileTool";
import { toast } from "react-toastify";
import { getBasename, getName } from "@/functions/doc/PathParse";
import { BooleanToNumber, unknownToString } from "@/functions/doc/ToFunction";
import { corsFetch } from "@/functions/fetch";
import { concatOriginUrl } from "@/functions/originUrl";
import {
  arrayPartition,
  PromiseOrder,
  PromiseOrderOptions,
} from "@/functions/arrayFunction";
import { CreateObjectState } from "@/state/CreateState";
import {
  toastLoadingOptions,
  toastUpdateOptions,
} from "@/components/define/toastContainerDef";
import { SendLinksDir } from "@/routes/edit/LinksEdit";
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
  INDEXEDDB_VERSION,
  INDEXEDDB_NAME,
} from "@/data/DataEnv";
import { MeeIndexedDB, MeeIndexedDBTable } from "./IndexedDB/MeeIndexedDB";
import { IndexedDataStateClass } from "./IndexedDB/IndexedDataStateClass";
import { ImageMeeIndexedDBTable } from "./IndexedDB/CustomMeeIndexedDB";
import { ImageIndexedDataStateClass } from "./IndexedDB/CustomIndexedDataStateClass";

export const tableVersionDataObject = new IndexedDataStateClass(
  TableVersionDataOptions
);

export const imageDataIndexed = new ImageIndexedDataStateClass(
  ImageDataOptions,
  new ImageMeeIndexedDBTable({ options: ImageDataOptions })
);
export const charactersDataIndexed = new IndexedDataStateClass(
  charactersDataOptions
);
export const postsDataIndexed = new IndexedDataStateClass(postsDataOptions);
export const soundsDataIndexed = new IndexedDataStateClass(soundsDataOptions);
export const soundAlbumsDataIndexed = new IndexedDataStateClass(
  soundAlbumsDataOptions
);
export const filesDataIndexed = new IndexedDataStateClass(filesDataOptions);
export const linksDataIndexed = new IndexedDataStateClass(linksDataOptions);
export const favLinksDataIndexed = new IndexedDataStateClass(
  linksFavDataOptions
);
export const likeDataIndexed = new IndexedDataStateClass(likeDataOptions);
export const keyValueDBDataIndexed = new IndexedDataStateClass(
  KeyValueDBDataOptions
);
export const KVDataIndexed = keyValueDBDataIndexed;

type anyIdbStateClass = IndexedDataStateClass<any, any, MeeIndexedDBTable<any>>;
export const IdbStateClassMap = new Map<string, anyIdbStateClass>();
(
  [
    tableVersionDataObject,
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
  IdbStateClassMap.set(item.options.key, item);
});
export const IdbStateClassList = Array.from(IdbStateClassMap.values());

let dbClass: MeeIndexedDB | undefined;

MeeIndexedDB.create({
  version: INDEXEDDB_VERSION,
  dbName: INDEXEDDB_NAME,
  onupgradeneeded(e, db) {
    IdbStateClassList.map(({ table }) => {
      table.dbUpgradeneeded(db);
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
});

const allDataSrc = "/data/all";
interface DataStateType {
  isAllLoad: LoadStateType;
  allLoad(load?: LoadStateType): void;
}
export const useDataState = CreateObjectState<DataStateType>((set) => ({
  isAllLoad: true,
  allLoad(load = true) {
    set({ isAllLoad: load });
  },
}));

export const DataState = React.memo(function DataState() {
  const apiOrigin = useApiOrigin()[0];
  const setSearchParamsOptionUrl = useCallback(
    async (Url: URL, isLoading?: LoadStateType, idb?: anyIdbStateClass) => {
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
    },
    []
  );
  const getDataFromApi = useCallback(
    async function <T = any>(
      src: string,
      isLoading?: LoadStateType,
      idb?: anyIdbStateClass
    ) {
      let Url = new URL(concatOriginUrl(apiOrigin || location.origin, src));
      Url = await setSearchParamsOptionUrl(Url, isLoading, idb);
      const cache = IndexedDataStateClass.getCacheOption(isLoading);
      return await corsFetch(Url.href, {
        cache: cache !== "no-cache-reload" ? cache : undefined,
      }).then(async (r) => (await r.json()) as T);
    },
    [apiOrigin]
  );
  function setEffect(
    obj: IndexedDataStateClass<any, any, MeeIndexedDBTable<any>>
  ) {
    const isSoloLoad = useSyncExternalStore(
      obj.subscribeToLoad,
      () => obj.isSoloLoad
    );
    useEffect(() => {
      if (isSoloLoad) {
        getDataFromApi<any[]>(obj.src, isSoloLoad, obj).then((items) => {
          obj.setData(items);
        });
      }
    }, [isSoloLoad]);
    const data = useSyncExternalStore(obj.subscribe, () => obj.table);
    useEffect(() => {
      obj.load(false);
    }, [data]);
  }

  IdbStateClassList.forEach((obj) => {
    setEffect(obj);
  });

  const { isAllLoad, allLoad } = useDataState();
  useEffect(() => {
    if (isAllLoad && apiOrigin) {
      (async () => {
        return getDataFromApi<KeyValueType<unknown[]>>(
          allDataSrc,
          isAllLoad
        ).then((items) =>
          Promise.all(
            IdbStateClassList.map(async (obj) => {
              const data = items[obj.key];
              await obj.setData(data);
            })
          )
        );
      })().finally(() => {
        allLoad(false);
      });
    }
  }, [isAllLoad, apiOrigin]);
  return <></>;
});

export function UploadToast<T = unknown>(promise: Promise<T>) {
  return toast.promise(promise, {
    pending: "アップロード中…",
    success: {
      render(r) {
        const kv = r.data as KeyValueType;
        return (
          unknownToString(kv && "message" in kv ? kv.message : r) ||
          "アップロードしました"
        );
      },
    },
    error: {
      render: (r) => {
        const e = r.data as any;
        return (
          unknownToString(
            e && typeof e === "object" && e.message ? e.message : e
          ) || "アップロードに失敗しました"
        );
      },
    },
  });
}

interface ImportToastOption extends Omit<PromiseOrderOptions, "sync"> {}
export function ImportToast(
  fetchList: (() => Promise<Response>)[],
  options: ImportToastOption = {}
) {
  const id = toast.loading("インポート中…", toastLoadingOptions);
  let max = fetchList.length;
  return new Promise<void>((resolve, reject) => {
    PromiseOrder(fetchList, {
      minTime: 200,
      ...options,
      sync(i) {
        if (id && i && max) {
          toast.update(id, {
            progress: i / max,
          });
        }
      },
    })
      .then(async (r) => {
        const rs = Array.isArray(r) ? r : [r];
        if (rs.every((r) => r.ok)) return r;
        else throw await rs.find((r) => !r.ok)!.text();
      })
      .then((r) => {
        toast.update(id!, {
          ...toastUpdateOptions,
          render: unknownToString(r) || "インポートしました",
          type: "success",
        });
        resolve();
      })
      .catch((e) => {
        toast.update(id!, {
          ...toastUpdateOptions,
          render: "インポートに失敗しました" + (e ? `\n[${e}]` : ""),
          type: "error",
        });
        reject();
      });
  });
}

interface DataUploadBaseProps {
  apiOrigin?: string;
  partition?: number;
  json?: any;
}

interface makeImportFetchListProps<T = unknown> extends DataUploadBaseProps {
  src: string;
  data: T[];
  partition?: number;
  object?: importEntryDataType;
  overwrite?: boolean;
}
export function makeImportFetchList({
  apiOrigin,
  src,
  data,
  partition = 100,
  object,
  overwrite = true,
}: makeImportFetchListProps) {
  return arrayPartition(data, partition).map((item, i) => {
    const entry = { ...object, data: item };
    if (overwrite) entry.overwrite = true;
    if (i === 0) entry.first = true;
    return () =>
      corsFetch(concatOriginUrl(apiOrigin, src), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
  });
}

type importEntryImageDataType = Omit<ImageDataType, "id" | "lastmod"> & {
  [k: string]: any;
};
interface ImportImagesJsonProps extends DataUploadBaseProps {
  charactersMap?: Map<string, CharacterType>;
  overwrite?: boolean;
}
export async function ImportImagesJson({
  apiOrigin,
  charactersMap,
  partition,
  overwrite,
  json,
}: ImportImagesJsonProps = {}) {
  return (json ? (async () => json)() : jsonFileDialog()).then(async (json) => {
    let object: importEntryDataType<importEntryImageDataType>;
    let data: importEntryImageDataType[];
    const versionStr: string = json.version || "0";
    const versions = versionStr.split(".");
    const version = Number(versions[0]);
    if (version === 0) {
      const oldData = json as YamlDataType[];
      const dataMap = new Map<string, importEntryImageDataType>();
      oldData.forEach((album) => {
        album.list?.forEach((item) => {
          const key = getBasename(String(item.src || item.name));
          if (!dataMap.has(key)) {
            const tagsArray = charactersMap
              ? item.tags?.filter((tag) => !charactersMap.has(tag))
              : item.tags;
            const charactersArray = charactersMap
              ? item.tags?.filter((tag) => charactersMap.has(tag))
              : null;
            const albumLastSlach = album.name?.lastIndexOf("/") ?? -1;
            dataMap.set(key, {
              key: getName(item.src),
              album:
                album.name && albumLastSlach >= 0
                  ? album.name.slice(albumLastSlach + 1)
                  : album.name,
              title: item.name,
              description: item.description,
              link: item.link,
              tags:
                tagsArray && tagsArray.length > 0
                  ? tagsArray.join(",")
                  : undefined,
              characters:
                charactersArray && charactersArray.length > 0
                  ? charactersArray.join(",")
                  : undefined,
              copyright: item.copyright?.join(),
              embed: item.embed,
              pickup: BooleanToNumber(item.pickup),
              topImage: BooleanToNumber(item.topImage),
              time: item.time ? new Date(item.time).toISOString() : undefined,
            });
          }
        });
      });
      object = { version: "0" };
      data = Object.values(Object.fromEntries(dataMap));
    } else {
      const { data: _data, ..._entry } = json as dataBaseType<ImageDataType>;
      object = _entry;
      data = _data ? _data : [];
    }
    const fetchList = makeImportFetchList({
      apiOrigin,
      src: "/image/import",
      partition,
      data,
      object,
      overwrite,
    });
    return ImportToast(fetchList);
  });
}

type importEntryCharacterDataType = Omit<
  CharacterDataType,
  "id" | "lastmod"
> & {
  [k: string]: any;
};
export async function ImportCharacterJson({
  apiOrigin,
  partition,
  json,
}: DataUploadBaseProps = {}) {
  return (json ? (async () => json)() : jsonFileDialog()).then(async (json) => {
    let object: importEntryDataType<importEntryCharacterDataType>;
    let data: importEntryCharacterDataType[];
    const version = json.version;
    if (typeof version === "undefined") {
      const oldData = json as OldCharaDataObjectType;
      const dataMap = new Map(Object.entries(oldData));
      dataMap.forEach((v) => {
        v.key = String(v.id);
        delete v.id;
      });
      object = { version: "0" };
      data = Object.values(Object.fromEntries(dataMap));
    } else {
      const { data: _data, ..._entry } =
        json as dataBaseType<CharacterDataType>;
      object = _entry;
      data = _data ? _data : [];
    }
    const fetchList = makeImportFetchList({
      apiOrigin,
      src: "/character/import",
      partition,
      data,
      object,
    });
    return ImportToast(fetchList);
  });
}

type importEntryPostDataType = Omit<PostDataType, "id" | "lastmod"> & {
  [k: string]: any;
};
export async function ImportPostJson({
  apiOrigin,
  partition,
  json,
}: DataUploadBaseProps = {}) {
  return (json ? (async () => json)() : jsonFileDialog()).then(async (json) => {
    let object: importEntryDataType<importEntryPostDataType>;
    let data: importEntryPostDataType[];
    const version = json.version;
    if (typeof version === "undefined") {
      const oldData = json as Omit<OldPostType, "localDraft">[];
      const dataMap = new Map(
        oldData.map((v) => {
          const {
            postId,
            category,
            date,
            updatedAt,
            noindex,
            draft,
            flags,
            ..._v
          } = v;
          const value: Omit<PostDataType, "id"> = {
            postId: postId!,
            category: category?.join(","),
            noindex:
              typeof noindex === "boolean" ? (noindex ? 1 : 0) : undefined,
            draft: typeof draft === "boolean" ? (draft ? 1 : 0) : undefined,
            time: date ? new Date(date).toISOString() : undefined,
            lastmod: updatedAt ? new Date(updatedAt).toISOString() : undefined,
            ..._v,
          };
          return [v.postId, value];
        })
      );
      object = { version: "0" };
      data = Object.values(Object.fromEntries(dataMap));
    } else {
      const { data: _data, ..._entry } = json as dataBaseType<PostDataType>;
      object = _entry;
      data = _data ? _data : [];
    }
    const fetchList = makeImportFetchList({
      apiOrigin,
      src: "/blog/import",
      partition,
      data,
      object,
    });
    return ImportToast(fetchList);
  });
}

interface ImportLinksJsonProps extends DataUploadBaseProps {
  dir?: SendLinksDir;
}
export async function ImportLinksJson({
  apiOrigin,
  partition,
  dir = "",
  json,
}: ImportLinksJsonProps = {}) {
  return (json ? (async () => json)() : jsonFileDialog()).then(async (json) => {
    let object: importEntryDataType<SiteLinkData>;
    let data: SiteLinkData[];
    const { data: _data, ..._entry } = json as dataBaseType<SiteLinkData>;
    object = _entry;
    data = _data ? _data : [];
    const fetchList = makeImportFetchList({
      apiOrigin,
      src: `/links${dir}/import`,
      partition,
      data,
      object,
    });
    return ImportToast(fetchList);
  });
}

export async function ImportKeyValueDBJson({
  apiOrigin,
  partition,
  json,
}: DataUploadBaseProps = {}) {
  return (json ? (async () => json)() : jsonFileDialog()).then(async (json) => {
    let object: importEntryDataType<KeyValueDBDataType>;
    let data: KeyValueDBDataType[];
    const { data: _data, ..._entry } = json as dataBaseType<KeyValueDBDataType>;
    object = _entry;
    data = _data ? _data : [];
    const fetchList = makeImportFetchList({
      apiOrigin,
      src: KeyValueDBDataOptions.src + "/import",
      partition,
      data,
      object,
    });
    return ImportToast(fetchList);
  });
}
