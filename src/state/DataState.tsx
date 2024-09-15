import { atom, useAtom } from "jotai";
import { ApiOriginAtom, isLoginAtom } from "./EnvState";
import { useEffect, useState } from "react";
import { jsonFileDialog } from "@/components/FileTool";
import toast from "react-hot-toast";
import { getBasename, getName } from "@/functions/doc/PathParse";
import { BooleanToNumber, unknownToString } from "@/functions/doc/ToFunction";
import { corsFetch } from "@/functions/fetch";
import { concatOriginUrl } from "@/functions/originUrl";
import { arrayPartition, PromiseOrder } from "@/functions/arrayFunction";
import { StorageDataAtomClass as SdaClass } from "@/functions/storage/StorageDataAtomClass";

export const imageDataObject = new SdaClass<ImageDataType>({
  key: "images",
  src: "/data/images",
  version: "1.3.0",
  preLoad: false,
});

export const charactersDataObject = new SdaClass<CharacterDataType>({
  key: "characters",
  src: "/data/characters",
  version: "1.3.0",
  preLoad: false,
});

export const postsDataObject = new SdaClass<PostDataType>({
  key: "posts",
  src: "/data/posts",
  version: "1.3.0",
  preLoad: false,
});

const allDataSrc = "/data/all";
export const allLoadAtom = atom<LoadAtomType>(true);

export function DataState() {
  const isLogin = useAtom(isLoginAtom)[0];
  const [settedIsLogin, setSettedIsLogin] = useState(false);
  useEffect(() => {
    if (typeof isLogin !== "undefined") {
      imageDataObject.isLogin = isLogin;
      charactersDataObject.isLogin = isLogin;
      postsDataObject.isLogin = isLogin;
      setSettedIsLogin(true);
    }
  }, [isLogin]);
  const apiOrigin = useAtom(ApiOriginAtom)[0];
  const [imagesLoad, setImagesLoad] = useAtom(imageDataObject.loadAtom);
  const setImagesData = useAtom(imageDataObject.dataAtom)[1];
  useEffect(() => {
    if (settedIsLogin && imagesLoad && apiOrigin) {
      imageDataObject
        .fetchData({
          apiOrigin,
          loadAtomValue: imagesLoad,
        })
        .then((data) => {
          imageDataObject.setData({
            data,
            setAtom: setImagesData,
          });
        });
      setImagesLoad(false);
    }
  }, [settedIsLogin, apiOrigin, imagesLoad, setImagesLoad, setImagesData]);

  const [charactersLoad, setCharactersLoad] = useAtom(
    charactersDataObject.loadAtom
  );
  const setCharactersData = useAtom(charactersDataObject.dataAtom)[1];
  useEffect(() => {
    if (settedIsLogin && charactersLoad && apiOrigin) {
      charactersDataObject
        .fetchData({
          apiOrigin,
          loadAtomValue: charactersLoad,
        })
        .then((data) => {
          charactersDataObject.setData({
            data,
            setAtom: setCharactersData,
          });
        });
      setCharactersLoad(false);
    }
  }, [
    settedIsLogin,
    apiOrigin,
    charactersLoad,
    setCharactersLoad,
    setCharactersData,
  ]);

  const [postsLoad, setPostsLoad] = useAtom(postsDataObject.loadAtom);
  const setPostsData = useAtom(postsDataObject.dataAtom)[1];
  useEffect(() => {
    if (settedIsLogin && postsLoad && apiOrigin) {
      postsDataObject
        .fetchData({
          apiOrigin,
          loadAtomValue: postsLoad,
        })
        .then((data) => {
          postsDataObject.setData({
            data,
            setAtom: setPostsData,
          });
        });
      setPostsLoad(false);
    }
  }, [settedIsLogin, apiOrigin, postsLoad, setPostsLoad, setPostsData]);

  const [allLoad, setAllLoad] = useAtom(allLoadAtom);
  useEffect(() => {
    if (settedIsLogin && apiOrigin && allLoad) {
      const Url = new URL(allDataSrc, apiOrigin);
      const cache = SdaClass.getCacheOption(allLoad);
      imageDataObject.setSearchParamsOption({
        searchParams: Url.searchParams,
        loadAtomValue: allLoad,
        prefix: "images",
      });
      charactersDataObject.setSearchParamsOption({
        searchParams: Url.searchParams,
        loadAtomValue: allLoad,
        prefix: "characters",
      });
      postsDataObject.setSearchParamsOption({
        searchParams: Url.searchParams,
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
            imageDataObject.setData({
              data: v.images as ImageDataType[],
              setAtom: setImagesData,
            }),
            charactersDataObject.setData({
              data: v.characters as CharacterDataType[],
              setAtom: setCharactersData,
            }),
            postsDataObject.setData({
              data: v.posts as PostDataType[],
              setAtom: setPostsData,
            }),
          ]);
        })
        .then(() => {
          setAllLoad(false);
        });
    }
  }, [
    settedIsLogin,
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
