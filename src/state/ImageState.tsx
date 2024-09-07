import { useCallback, useEffect, useMemo } from "react";
import { atom, useAtom } from "jotai";
import { EnvAtom } from "./EnvState";
import { getBasename } from "@/functions/doc/PathParse";
import { imagesDataAtom } from "./DataState";

export const imagesAtom = atom<ImageType[]>([]);
export const imagesMapAtom = atom<Map<string, ImageType>>();
export const imageAlbumsAtom = atom<Map<string, ImageAlbumType>>();

export function ImageState() {
  const imagesData = useAtom(imagesDataAtom)[0];
  const setImages = useAtom(imagesAtom)[1];
  const setImagesMap = useAtom(imagesMapAtom)[1];
  const setAlbums = useAtom(imageAlbumsAtom)[1];
  const env = useAtom(EnvAtom)[0];
  useEffect(() => {
    if (imagesData && env) {
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
      imagesData.forEach((v) => {
        const albumObject = v.album ? albums.get(v.album) : undefined;
        const item: ImageType = {
          ...v,
          tags: v.tags?.split(","),
          characters: v.characters?.split(","),
          copyright: v.copyright?.split(","),
          topImage:
            typeof v.topImage === "number" ? Boolean(v.topImage) : undefined,
          pickup: typeof v.pickup === "number" ? Boolean(v.pickup) : undefined,
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
    }
  }, [imagesData, env]);
  return <></>;
}

export function UrlMediaOrigin(mediaOrigin?: string, src?: OrNull<string>) {
  if (mediaOrigin && src) {
    return mediaOrigin + "/" + src;
  } else return "";
}
