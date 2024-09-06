import { atom, SetStateAction, useAtom } from "jotai";
import { ApiOriginAtom, EnvAtom } from "./EnvState";
import { useCallback, useEffect } from "react";
import { StorageDataClass } from "@/functions/StorageDataClass";

const imagesDataSrc = "/image/data";
export const imageStorageData = new StorageDataClass<ImageDataType[]>(
  "images",
  "1.1.30"
);
export const imagesDataAtom = atom<ImageDataType[]>();
export const imagesLoadAtom = atom(true);

const charactersDataSrc = "/character/data";
export const characterStorageData = new StorageDataClass<CharacterDataType[]>(
  "characters",
  "1.1.2"
);
export const charactersDataAtom = atom<CharacterDataType[]>();
export const charactersLoadAtom = atom(true);

async function loadData<T>({
  src,
  apiOrigin,
  StorageData,
  setAtom,
  id = "id",
  mtime = "mtime",
}: {
  src: string;
  apiOrigin?: string;
  StorageData: StorageDataClass<T[]>;
  setAtom: (args_0: SetStateAction<T[] | undefined>) => void;
  id?: string;
  mtime?: string;
}) {
  if (apiOrigin) {
    const Url = new URL(src, apiOrigin);
    const { data: sData, endpoint: sEndpoint } = StorageData;
    if (sEndpoint) Url.searchParams.set("endpoint", sEndpoint);
    await fetch(Url.href)
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
            const cm = ((c as any)[mtime] || "") as string;
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
      });
      setCharactersLoad(false);
    }
  }, [apiOrigin, charactersLoad, setCharactersLoad, setCharactersData]);
  return <></>;
}
