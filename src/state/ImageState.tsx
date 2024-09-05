import { useCallback, useEffect, useMemo } from "react";
import { atom, useAtom } from "jotai";
import { ApiOriginAtom, EnvAtom, MediaOriginAtom } from "./EnvState";
import { StorageDataClass } from "@/functions/StorageDataClass";
import { getBasename } from "@/functions/doc/PathParse";

export const imagesIsSet = atom(false);
export const imagesAtom = atom<ImageType[]>([]);
export const imagesMapAtom = atom<Map<string, ImageType>>();
export const imageAlbumsAtom = atom<Map<string, ImageAlbumType>>();
export const imagesResetAtom = atom(true);

const StorageData = new StorageDataClass<ImageDataType[]>("images", "1.1.29");

export function ImageState() {
  const setImages = useAtom(imagesAtom)[1];
  const setImagesMap = useAtom(imagesMapAtom)[1];
  const setAlbums = useAtom(imageAlbumsAtom)[1];
  const setIsSet = useAtom(imagesIsSet)[1];
  const [reset, setReset] = useAtom(imagesResetAtom);
  const apiOrigin = useAtom(ApiOriginAtom)[0];
  const env = useAtom(EnvAtom)[0];
  const callback = useCallback(async () => {
    if (env && apiOrigin) {
      const Url = new URL("/image/data", apiOrigin);
      const { data: sData, endpoint: sEndpoint } = StorageData;
      if (sEndpoint) Url.searchParams.set("endpoint", sEndpoint);
      await fetch(Url.href)
        .then(async (r) => (await r.json()) as ImageDataType[])
        .then((data) => {
          if (sData) {
            data.forEach((d) => {
              const index = sData.findIndex(({ id }) => id === d.id);
              if (index >= 0) {
                sData[index] = d;
              } else {
                sData.push(d);
              }
            });
            data = sData;
          }
          StorageData.setItem(
            data,
            data.reduce((a, { mtime = "" }) => (a > mtime ? a : mtime), "")
          );
          const albums = new Map<string, ImageAlbumType>();
          env.IMAGE_ALBUMS?.forEach((album) => {
            if (album.name && !albums.has(album.name)) {
              albums.set(album.name, {
                visible: { filename: true, info: true, title: true },
                ...album,
                list: [],
              });
            }
          });
          const imagesMap = new Map<string, ImageType>();
          data.forEach((v) => {
            const albumObject = v.album ? albums.get(v.album) : undefined;
            const item: ImageType = {
              ...v,
              tags: v.tags ? v.tags.split(",") : [],
              copyright: v.copyright?.split(","),
              topImage:
                typeof v.topImage === "number"
                  ? Boolean(v.topImage)
                  : undefined,
              pickup:
                typeof v.pickup === "number" ? Boolean(v.pickup) : undefined,
              time: v.time ? new Date(v.time) : undefined,
              mtime: v.mtime ? new Date(v.mtime) : undefined,
              albumObject,
            };
            const key = getBasename(String(item.src || item.name));
            if (!imagesMap.has(key)) {
              albumObject?.list.push(item);
              imagesMap.set(key, item);
            }
          });
          setImagesMap(imagesMap);
          setImages(Object.values(Object.fromEntries(imagesMap)));
          setAlbums(albums);
        });
      return true;
    } else {
      return false;
    }
  }, [apiOrigin, setIsSet, env]);
  useEffect(() => {
    if (reset) {
      callback().then((result) => {
        if (result) {
          setIsSet(true);
          setReset(false);
        }
      });
    }
  }, [reset, setReset, callback]);
  return <></>;
}

export function UrlMediaOrigin(mediaOrigin?: string, src?: OrNull<string>) {
  if (mediaOrigin && src) {
    return mediaOrigin + "/" + src;
  } else return "";
}
