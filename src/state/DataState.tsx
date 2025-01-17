import { useApiOrigin, useIsLogin } from "./EnvState";
import { useEffect, useState } from "react";
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
import { StorageDataStateClass as SdsClass } from "@/functions/storage/StorageDataStateClass";
import { CreateState } from "./CreateState";
import {
  compat_v1_v2_ImageDataType,
  CompatSrcMerge,
} from "@/routes/edit/compat/SrcMerge";
import {
  toastLoadingOptions,
  toastUpdateOptions,
} from "@/components/define/toastContainerDef";
import { SendLinksDir } from "@/routes/edit/LinksEdit";

export const imageDataObject = new SdsClass<ImageDataType>({
  key: "images",
  src: "/data/images",
  version: "3.0.2",
  preLoad: false,
  latestField: { time: "desc" },
});

export const charactersDataObject = new SdsClass<CharacterDataType>({
  key: "characters",
  src: "/data/characters",
  version: "1.5.0",
  preLoad: false,
  latestField: { id: "desc" },
});

export const postsDataObject = new SdsClass<PostDataType>({
  key: "posts",
  src: "/data/posts",
  version: "1.4.0",
  preLoad: false,
  latestField: { time: "desc" },
});

export const soundsDataObject = new SdsClass<SoundDataType>({
  key: "sounds",
  src: "/data/sounds",
  version: "1.3.1",
  preLoad: false,
  latestField: { time: "desc" },
});

export const soundAlbumsDataObject = new SdsClass<SoundAlbumDataType>({
  key: "soundAlbums",
  src: "/data/soundAlbums",
  version: "1.3.1",
  preLoad: false,
});

export const filesDataObject = new SdsClass<FilesRecordDataType>({
  key: "files",
  src: "/data/files",
  version: "1.3.0",
  preLoad: false,
});

export const linksDataObject = new SdsClass<SiteLinkData>({
  key: "links",
  src: "/data/links",
  version: "1.0.0",
  preLoad: false,
});

export const favLinksDataObject = new SdsClass<SiteLinkData>({
  key: "linksFav",
  src: "/data/links/fav",
  version: "1.0.1",
  preLoad: false,
});

const allDataSrc = "/data/all";
export const allDataLoadState = CreateState<LoadStateType>(true);

const DataObjectList: SdsClass<any>[] = [
  imageDataObject,
  charactersDataObject,
  postsDataObject,
  soundsDataObject,
  soundAlbumsDataObject,
  filesDataObject,
  linksDataObject,
  favLinksDataObject,
];

export function DataState() {
  const isLogin = useIsLogin()[0];
  const [settedIsLogin, setSettedIsLogin] = useState(false);
  useEffect(() => {
    if (typeof isLogin !== "undefined") {
      DataObjectList.forEach((object) => {
        object.isLogin = isLogin;
      });
      setSettedIsLogin(true);
    }
  }, [isLogin]);

  const apiOrigin = useApiOrigin()[0];
  function SdsClassSetData<T extends object>(dataObject: SdsClass<T>) {
    const [load, setLoad] = dataObject.useLoad();
    const setData = dataObject.useData()[1];
    useEffect(() => {
      if (settedIsLogin && load && apiOrigin) {
        dataObject
          .fetchData({
            apiOrigin,
            loadValue: load,
          })
          .then(async (data) => {
            await dataObject.setData({
              data,
              setState: setData,
            });
          });
        setLoad(false);
      }
    }, [settedIsLogin, apiOrigin, load, setLoad, setData]);
  }

  SdsClassSetData(imageDataObject);
  const setImagesData = imageDataObject.useData()[1];

  SdsClassSetData(charactersDataObject);
  const setCharactersData = charactersDataObject.useData()[1];

  SdsClassSetData(postsDataObject);
  const setPostsData = postsDataObject.useData()[1];

  SdsClassSetData(soundsDataObject);
  const setSoundsData = soundsDataObject.useData()[1];

  SdsClassSetData(soundAlbumsDataObject);
  const setSoundAlbumsData = soundAlbumsDataObject.useData()[1];

  SdsClassSetData(filesDataObject);
  const setFilesData = filesDataObject.useData()[1];

  SdsClassSetData(linksDataObject);
  const setLinksData = linksDataObject.useData()[1];

  SdsClassSetData(favLinksDataObject);
  const setFavLinksData = favLinksDataObject.useData()[1];

  const [allLoad, setAllLoad] = allDataLoadState();
  useEffect(() => {
    if (settedIsLogin && apiOrigin && allLoad) {
      const Url = new URL(
        concatOriginUrl(apiOrigin || location.origin, allDataSrc)
      );
      const cache = SdsClass.getCacheOption(allLoad);
      function SetSearchParamsOption<T extends object>(
        dataObject: SdsClass<T>
      ) {
        dataObject.setSearchParamsOption({
          searchParams: Url.searchParams,
          loadValue: allLoad,
          prefix: dataObject.key,
        });
      }
      function SetData<T extends object>(
        dataObject: SdsClass<T>,
        v: unknown[] | KeyValueType<unknown>,
        setState: setStateFunction<T>
      ) {
        const data = (Array.isArray(v) ? v : v[dataObject.key]) as T[];
        return (
          dataObject.setData({
            data,
            setState,
          }),
          dataObject.setSearchParamsOption({
            searchParams: Url.searchParams,
            loadValue: allLoad,
            prefix: dataObject.key,
          })
        );
      }
      DataObjectList.forEach((object) => {
        SetSearchParamsOption(object);
      });
      if (cache) Url.searchParams.set("cache", cache);
      corsFetch(Url.href, {
        cache: cache !== "no-cache-reload" ? cache : undefined,
      })
        .then(async (r) => (await r.json()) as KeyValueType<unknown[]>)
        .then(async (v) => {
          return Promise.all([
            SetData(imageDataObject, v, setImagesData),
            SetData(charactersDataObject, v, setCharactersData),
            SetData(postsDataObject, v, setPostsData),
            SetData(soundsDataObject, v, setSoundsData),
            SetData(soundAlbumsDataObject, v, setSoundAlbumsData),
            SetData(filesDataObject, v, setFilesData),
            SetData(linksDataObject, v, setLinksData),
            SetData(favLinksDataObject, v, setFavLinksData),
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
    setImagesData,
    setCharactersData,
    setPostsData,
    setSoundsData,
    setSoundAlbumsData,
    setFilesData,
    setLinksData,
    setFavLinksData,
  ]);
  return <></>;
}

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
export async function ImportToast(
  fetchList: (() => Promise<Response>)[],
  options: ImportToastOption = {}
) {
  const id = toast.loading("インポート中…", toastLoadingOptions);
  let max = fetchList.length;
  return PromiseOrder(fetchList, {
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
    })
    .catch((e) => {
      toast.update(id!, {
        ...toastUpdateOptions,
        render: "インポートに失敗しました" + (e ? `\n[${e}]` : ""),
        type: "error",
      });
    });
}

interface DataUploadBaseProps {
  apiOrigin?: string;
  partition?: number;
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
}: ImportImagesJsonProps = {}) {
  return jsonFileDialog().then(async (json) => {
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
    } else if (version <= 2) {
      const _json: dataBaseType<compat_v1_v2_ImageDataType> = json;
      if (version === 1) {
        await CompatSrcMerge({
          apiOrigin,
          data: _json.data,
          doneClose: 1000,
        });
        _json.data?.forEach((v) => {
          const webpPath = v.webp || v.icon;
          if (webpPath) v.src = "image/" + getBasename(webpPath);
          delete v.webp;
          delete v.icon;
        });
      }
      const { data: _data, ..._entry } = _json;
      object = _entry;
      data = _data ? _data.map((d) => ({ title: d.name, ...d })) : [];
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
}: DataUploadBaseProps = {}) {
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
    return ImportToast(fetchList);
  });
}

type importEntryPostDataType = Omit<PostDataType, "id" | "lastmod"> & {
  [k: string]: any;
};
export async function ImportPostJson({
  apiOrigin,
  partition,
}: DataUploadBaseProps = {}) {
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
}: ImportLinksJsonProps = {}) {
  return jsonFileDialog().then((json) => {
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
