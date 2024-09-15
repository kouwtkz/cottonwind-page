import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import { EnvAtom, isLoginAtom } from "./EnvState";
import { imageDataObject } from "./DataState";
import { getImageObjectMap } from "@/functions/imageFunctions";

export const imagesAtom = atom<ImageType[]>();
export const imagesMapAtom = atom<Map<string, ImageType>>();
export const imageAlbumsAtom = atom<Map<string, ImageAlbumType>>();

export function ImageState() {
  const imagesData = useAtom(imageDataObject.dataAtom)[0];
  const setImages = useAtom(imagesAtom)[1];
  const setImagesMap = useAtom(imagesMapAtom)[1];
  const setAlbums = useAtom(imageAlbumsAtom)[1];
  const env = useAtom(EnvAtom)[0];
  const isLogin = useAtom(isLoginAtom)[1];
  useEffect(() => {
    if (imagesData && env) {
      const { imagesMap, imageAlbumMap } = getImageObjectMap(
        imagesData,
        env.IMAGE_ALBUMS
      );
      imagesMap.forEach((image) => {
        image.update = Boolean(
          !isLogin &&
            image.lastmod &&
            imageDataObject.beforeLastmod &&
            image.lastmod.getTime() > imageDataObject.beforeLastmod.getTime()
        );
        image.new =
          image.update &&
          (image.time && imageDataObject.latest?.time
            ? image.time.toISOString() > imageDataObject.latest.time
            : false);
      });
      setImagesMap(imagesMap);
      setImages(Object.values(Object.fromEntries(imagesMap)));
      setAlbums(imageAlbumMap);
    }
  }, [imagesData, env, isLogin]);
  return <></>;
}
