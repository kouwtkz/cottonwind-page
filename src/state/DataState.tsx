import { atom, SetStateAction, useAtom } from "jotai";
import { ApiOriginAtom, EnvAtom } from "./EnvState";
import { useCallback, useEffect } from "react";
import { StorageDataClass } from "@/functions/StorageDataClass";
import { jsonFileDialog } from "@/components/FileTool";
import toast from "react-hot-toast";
import { getBasename } from "@/functions/doc/PathParse";
import { BooleanToNumber, unknownToString } from "@/functions/doc/ToFunction";

const imagesDataSrc = "/data/images";
export const imageStorageData = new StorageDataClass<ImageDataType[]>(
  "images",
  "1.1.31"
);
export const imagesDataAtom = atom<ImageDataType[]>();
export const imagesLoadAtom = atom<LoadAtomType>(true);

const charactersDataSrc = "/data/characters";
export const characterStorageData = new StorageDataClass<CharacterDataType[]>(
  "characters",
  "1.1.9"
);
export const charactersDataAtom = atom<CharacterDataType[]>();
export const charactersLoadAtom = atom<LoadAtomType>(true);

async function loadData<T>({
  src,
  apiOrigin,
  StorageData,
  setAtom,
  loadAtomValue,
  id = "id",
  lastmod = "lastmod",
}: {
  src: string;
  apiOrigin?: string;
  StorageData: StorageDataClass<T[]>;
  setAtom: (args_0: SetStateAction<T[] | undefined>) => void;
  loadAtomValue?: LoadAtomType;
  id?: string;
  lastmod?: string;
}) {
  if (apiOrigin) {
    const Url = new URL(src, apiOrigin);
    if (loadAtomValue === "no-cache-reload") StorageData.removeItem();
    const { data: sData, endpoint: sEndpoint } = StorageData;
    if (sEndpoint) Url.searchParams.set("endpoint", sEndpoint);
    const cache = typeof loadAtomValue === "string" ? loadAtomValue : undefined;
    if (cache) Url.searchParams.set("cache", cache);
    console.log(Url, StorageData);
    await fetch(Url.href, {
      cache: cache !== "no-cache-reload" ? cache : undefined,
    })
      .then(async (r) => (await r.json()) as T[])
      .then((data) => {
        if (sData) {
          data.forEach((d) => {
            const index = sData.findIndex(
              (v) => (v as any)[id] === (d as any)[id]
            );
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
      });
    return true;
  }
}

export function DataState() {
  const apiOrigin = useAtom(ApiOriginAtom)[0];

  const [imagesLoad, setImagesLoad] = useAtom(imagesLoadAtom);
  const setImagesData = useAtom(imagesDataAtom)[1];
  useEffect(() => {
    if (imagesLoad && apiOrigin) {
      loadData({
        src: imagesDataSrc,
        apiOrigin,
        StorageData: imageStorageData,
        setAtom: setImagesData,
        loadAtomValue: imagesLoad,
      });
      setImagesLoad(false);
    }
  }, [apiOrigin, imagesLoad, setImagesLoad, setImagesData]);

  const [charactersLoad, setCharactersLoad] = useAtom(charactersLoadAtom);
  const setCharactersData = useAtom(charactersDataAtom)[1];
  useEffect(() => {
    if (charactersLoad && apiOrigin) {
      loadData({
        src: charactersDataSrc,
        apiOrigin,
        StorageData: characterStorageData,
        setAtom: setCharactersData,
        loadAtomValue: charactersLoad,
      });
      setCharactersLoad(false);
    }
  }, [apiOrigin, charactersLoad, setCharactersLoad, setCharactersData]);
  return <></>;
}

export function UploadToast(promise: Promise<unknown>) {
  return toast.promise(promise, {
    loading: "アップロード中…",
    success: (result) => unknownToString(result) || "アップロードしました",
    error: (error) => unknownToString(error) || "アップロードに失敗しました",
  });
}

export function ImportToast(promise: Promise<unknown>) {
  return toast.promise(promise, {
    loading: "インポート中…",
    success: (result) => unknownToString(result) || "インポートしました",
    error: (error) => unknownToString(error) || "インポートに失敗しました",
  });
}

interface DataUploadBaseProps {
  apiOrigin?: string;
}

interface ImportImagesJsonProps extends DataUploadBaseProps {
  charactersMap?: Map<string, CharacterType>;
}
export async function ImportImagesJson({
  apiOrigin,
  charactersMap,
}: ImportImagesJsonProps = {}) {
  const url = (apiOrigin || "") + "/image/import";
  return jsonFileDialog().then((json) => {
    const version = json.version;
    const data = new FormData();
    if (typeof version === "undefined") {
      const oldData = json as YamlDataType[];
      const dataMap = new Map<string, ImageDataType>();
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
              src: "image/" + item.src,
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
      data.append("version", "0");
      data.append(
        "data",
        JSON.stringify(Object.values(Object.fromEntries(dataMap)))
      );
    }
    if (Object.values(Object.fromEntries(data)).length > 0) {
      return ImportToast(fetch(url, { method: "POST", body: data }));
    }
  });
}

interface ImportCharactersJsonProps extends DataUploadBaseProps {}
export async function ImportCharacterJson({
  apiOrigin,
}: ImportCharactersJsonProps = {}) {
  const url = (apiOrigin || "") + "/character/import";
  return jsonFileDialog().then((json) => {
    const version = json.version;
    const data = new FormData();
    if (typeof version === "undefined") {
      const oldData = json as OldCharaDataObjectType;
      const dataMap = new Map(Object.entries(oldData));
      data.append("version", "0");
      data.append(
        "data",
        JSON.stringify(Object.values(Object.fromEntries(dataMap)))
      );
    }
    if (Object.values(Object.fromEntries(data)).length > 0) {
      return ImportToast(fetch(url, { method: "POST", body: data }));
    }
  });
}
