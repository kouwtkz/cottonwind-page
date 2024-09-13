import { atom, SetStateAction, useAtom } from "jotai";
import { ApiOriginAtom, EnvAtom } from "./EnvState";
import { useCallback, useEffect } from "react";
import { StorageDataClass } from "@/functions/StorageDataClass";
import { jsonFileDialog } from "@/components/FileTool";
import toast from "react-hot-toast";
import { getBasename, getName } from "@/functions/doc/PathParse";
import { BooleanToNumber, unknownToString } from "@/functions/doc/ToFunction";
import { setPrefix } from "@/functions/doc/prefix";
import { corsFetch } from "@/functions/fetch";
import { concatOriginUrl } from "@/functions/originUrl";
import { arrayPartition, PromiseOrder } from "@/functions/arrayFunction";
import { sleep } from "@/functions/Time";

const imagesDataSrc = "/data/images";
export const imageStorageData = new StorageDataClass<ImageDataType[]>(
  "images",
  "1.2.0"
);
export const imagesDataAtom = atom<ImageDataType[]>();
export const imagesLoadAtom = atom<LoadAtomType>(false);

const charactersDataSrc = "/data/characters";
export const characterStorageData = new StorageDataClass<CharacterDataType[]>(
  "characters",
  "1.2.1"
);
export const charactersDataAtom = atom<CharacterDataType[]>();
export const charactersLoadAtom = atom<LoadAtomType>(false);

const postsDataSrc = "/data/posts";
export const postStorageData = new StorageDataClass<PostDataType[]>(
  "posts",
  "1.1.1"
);
export const postsDataAtom = atom<PostDataType[]>();
export const postsLoadAtom = atom<LoadAtomType>(false);

const allDataSrc = "/data/all";
export const allLoadAtom = atom<LoadAtomType>(true);

interface readDataProps<T> {
  data?: T[];
  setAtom: (args_0: SetStateAction<T[] | undefined>) => void;
  StorageData: StorageDataClass<T[]>;
  id?: string;
  lastmod?: string;
}
async function setData<T>({
  data,
  setAtom,
  StorageData,
  id = "id",
  lastmod = "lastmod",
}: readDataProps<T>) {
  if (!data) return;
  const { data: sData } = StorageData;
  if (sData) {
    data.forEach((d) => {
      const index = sData.findIndex((v) => (v as any)[id] === (d as any)[id]);
      if (index >= 0) {
        sData[index] = d;
      } else {
        sData.push(d);
      }
    });
    data = [...sData];
  }
  StorageData.setItem(
    data,
    data.reduce((a, c) => {
      const cm = ((c as any)[lastmod] || "") as string;
      return a > cm ? a : cm;
    }, "")
  );
  setAtom(data);
}

function getCacheOption(loadAtomValue?: LoadAtomType) {
  return typeof loadAtomValue === "string" ? loadAtomValue : undefined;
}
interface setSearchParamsOptionProps<T> {
  searchParams: URLSearchParams;
  StorageData: StorageDataClass<T[]>;
  loadAtomValue?: LoadAtomType;
  prefix?: string;
}
function setSearchParamsOption<T>({
  searchParams,
  StorageData,
  loadAtomValue,
  prefix,
}: setSearchParamsOptionProps<T>) {
  if (loadAtomValue === "no-cache-reload") StorageData.removeItem();
  const { lastmod: sEndpoint } = StorageData;
  if (sEndpoint) searchParams.set(setPrefix("lastmod", prefix), sEndpoint);
  return searchParams;
}
interface fetchDataProps<T>
  extends Omit<setSearchParamsOptionProps<T>, "searchParams"> {
  src?: string;
  apiOrigin?: string;
}
async function fetchData<T>({
  src = "",
  apiOrigin,
  StorageData,
  loadAtomValue,
}: fetchDataProps<T>) {
  if (apiOrigin) {
    const Url = new URL(src, apiOrigin);
    setSearchParamsOption({
      searchParams: Url.searchParams,
      StorageData,
      loadAtomValue,
    });
    const cache = getCacheOption(loadAtomValue);
    if (cache) Url.searchParams.set("cache", cache);
    return corsFetch(Url.href, {
      cache: cache !== "no-cache-reload" ? cache : undefined,
    }).then(async (r) => (await r.json()) as T[]);
  }
}

export function DataState() {
  const apiOrigin = useAtom(ApiOriginAtom)[0];
  const [imagesLoad, setImagesLoad] = useAtom(imagesLoadAtom);
  const setImagesData = useAtom(imagesDataAtom)[1];
  useEffect(() => {
    if (imagesLoad && apiOrigin) {
      fetchData({
        src: imagesDataSrc,
        apiOrigin,
        StorageData: imageStorageData,
        loadAtomValue: imagesLoad,
      }).then((data) => {
        setData({
          data,
          setAtom: setImagesData,
          StorageData: imageStorageData,
        });
      });
      setImagesLoad(false);
    }
  }, [apiOrigin, imagesLoad, setImagesLoad, setImagesData]);

  const [charactersLoad, setCharactersLoad] = useAtom(charactersLoadAtom);
  const setCharactersData = useAtom(charactersDataAtom)[1];
  useEffect(() => {
    if (charactersLoad && apiOrigin) {
      fetchData({
        src: charactersDataSrc,
        apiOrigin,
        StorageData: characterStorageData,
        loadAtomValue: charactersLoad,
      }).then((data) => {
        setData({
          data,
          setAtom: setCharactersData,
          StorageData: characterStorageData,
        });
      });
      setCharactersLoad(false);
    }
  }, [apiOrigin, charactersLoad, setCharactersLoad, setCharactersData]);

  const [postsLoad, setPostsLoad] = useAtom(postsLoadAtom);
  const setPostsData = useAtom(postsDataAtom)[1];
  useEffect(() => {
    if (postsLoad && apiOrigin) {
      fetchData({
        src: postsDataSrc,
        apiOrigin,
        StorageData: postStorageData,
        loadAtomValue: postsLoad,
      }).then((data) => {
        setData({
          data,
          setAtom: setPostsData,
          StorageData: postStorageData,
        });
      });
      setPostsLoad(false);
    }
  }, [apiOrigin, postsLoad, setPostsLoad, setPostsData]);

  const [allLoad, setAllLoad] = useAtom(allLoadAtom);
  useEffect(() => {
    if (apiOrigin && allLoad) {
      const Url = new URL(allDataSrc, apiOrigin);
      const cache = getCacheOption(allLoad);
      setSearchParamsOption({
        searchParams: Url.searchParams,
        StorageData: imageStorageData,
        loadAtomValue: allLoad,
        prefix: "images",
      });
      setSearchParamsOption({
        searchParams: Url.searchParams,
        StorageData: characterStorageData,
        loadAtomValue: allLoad,
        prefix: "characters",
      });
      setSearchParamsOption({
        searchParams: Url.searchParams,
        StorageData: postStorageData,
        loadAtomValue: allLoad,
        prefix: "posts",
      });
      if (cache) Url.searchParams.set("cache", cache);
      corsFetch(Url.href, {
        cache: cache !== "no-cache-reload" ? cache : undefined,
      })
        .then(async (r) => (await r.json()) as KeyValueType<unknown[]>)
        .then(async (v) => {
          return Promise.all([
            setData({
              data: v.images as ImageDataType[],
              setAtom: setImagesData,
              StorageData: imageStorageData,
            }),
            setData({
              data: v.characters as CharacterDataType[],
              setAtom: setCharactersData,
              StorageData: characterStorageData,
            }),
            setData({
              data: v.posts as PostDataType[],
              setAtom: setPostsData,
              StorageData: postStorageData,
            }),
          ]);
        })
        .then(() => {
          setAllLoad(false);
        });
    }
  }, [
    apiOrigin,
    allLoad,
    setAllLoad,
    setPostsLoad,
    setImagesData,
    setCharactersData,
    setPostsData,
  ]);
  return <></>;
}

export function UploadToast<T = unknown>(promise: Promise<T>) {
  return toast.promise(promise, {
    loading: "アップロード中…",
    success: (result) => {
      const kv = result as KeyValueType;
      return (
        unknownToString("message" in kv ? kv.message : result) ||
        "アップロードしました"
      );
    },
    error: (error) => {
      const kv = error as KeyValueType;
      return (
        unknownToString("message" in kv ? kv.message : error) ||
        "アップロードに失敗しました"
      );
    },
  });
}

export function ImportToast(promise: Promise<Response | Response[]>) {
  return toast.promise(
    promise.then(async (r) => {
      const rs = Array.isArray(r) ? r : [r];
      if (rs.every((r) => r.ok)) return r;
      else throw await rs.find((r) => !r.ok)!.text();
    }),
    {
      loading: "インポート中…",
      success: (result) => unknownToString(result) || "インポートしました",
      error: (e) => "インポートに失敗しました" + (e ? `\n[${e}]` : ""),
    }
  );
}

interface DataUploadBaseProps {
  apiOrigin?: string;
  partition?: number;
}

interface makeImportFetchListProps<T = unknown> extends DataUploadBaseProps {
  src: string;
  data: T[];
  partition: number;
  object: importEntryDataType;
}
function makeImportFetchList({
  apiOrigin,
  src,
  data,
  partition,
  object,
}: makeImportFetchListProps) {
  return arrayPartition(data, partition).map((item, i) => {
    const entry = { ...object, data: item };
    if (i === 0) entry.overwrite = true;
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
}
export async function ImportImagesJson({
  apiOrigin,
  charactersMap,
  partition = 500,
}: ImportImagesJsonProps = {}) {
  return jsonFileDialog().then(async (json) => {
    let object: importEntryDataType<importEntryImageDataType>;
    let data: importEntryImageDataType[];
    const version = json.version;
    if (typeof version === "undefined") {
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
              name: item.name,
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
    });
    await ImportToast(PromiseOrder(fetchList, 10));
  });
}

type importEntryCharacterDataType = Omit<
  CharacterDataType,
  "id" | "lastmod"
> & {
  [k: string]: any;
};
interface ImportCharactersJsonProps extends DataUploadBaseProps {}
export async function ImportCharacterJson({
  apiOrigin,
  partition = 500,
}: ImportCharactersJsonProps = {}) {
  return jsonFileDialog().then(async (json) => {
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
    return ImportToast(PromiseOrder(fetchList, 10));
  });
}

type importEntryPostDataType = Omit<PostDataType, "id" | "lastmod"> & {
  [k: string]: any;
};
interface ImportCharactersJsonProps extends DataUploadBaseProps {}
export async function ImportPostJson({
  apiOrigin,
  partition = 500,
}: ImportCharactersJsonProps = {}) {
  return jsonFileDialog().then((json) => {
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
    return ImportToast(PromiseOrder(fetchList, 10));
  });
}
