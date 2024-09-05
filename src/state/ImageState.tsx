import { useCallback, useEffect, useMemo } from "react";
import { atom, useAtom } from "jotai";
import { ApiOriginAtom, EnvAtom, MediaOriginAtom } from "./EnvState";

export const imagesIsSet = atom(false);
export const imagesAtom = atom<ImageType[]>([]);
export const imageAlbumsAtom = atom<Map<string, ImageAlbumType>>();
export const imagesResetAtom = atom(true);

export function ImageState() {
  const setImages = useAtom(imagesAtom)[1];
  const [albums, setAlbums] = useAtom(imageAlbumsAtom);
  const setIsSet = useAtom(imagesIsSet)[1];
  const [reset, setReset] = useAtom(imagesResetAtom);
  const apiOrigin = useAtom(ApiOriginAtom)[0];
  const mediaOrigin = useAtom(MediaOriginAtom)[0];
  const env = useAtom(EnvAtom)[0];
  const url = useMemo(
    () => (apiOrigin ? apiOrigin + "/image/data" : null),
    [apiOrigin]
  );
  const callback = useCallback(async () => {
    if (env && url) {
      await fetch(url)
        .then(async (r) => (await r.json()) as ImageDataType[])
        .then((data) => {
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
          const images = data.map((v) => {
            const albumObject = v.album ? albums.get(v.album) : undefined;
            const item: ImageType = {
              ...v,
              tags: v.tags ? v.tags.split(",") : [],
              copyright: v.copyright?.split(","),
              topImage: typeof v.topImage === "number" ? Boolean(v.topImage) : undefined,
              pickup: typeof v.pickup === "number" ? Boolean(v.pickup) : undefined,
              time: v.time ? new Date(v.time) : undefined,
              mtime: v.mtime ? new Date(v.mtime) : undefined,
              albumObject,
            };
            albumObject?.list.push(item);
            return item;
          });
          setImages(images);
          setAlbums(albums);
        });
      return true;
    } else {
      return false;
    }
  }, [url, setIsSet, env]);
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
