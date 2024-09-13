import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import { EnvAtom } from "./EnvState";
import { imagesDataAtom } from "./DataState";
import { getImageObjectMap } from "@/functions/imageFunctions";

export const imagesAtom = atom<ImageType[]>();
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
      const { imagesMap, imageAlbumMap } = getImageObjectMap(
        imagesData,
        env.IMAGE_ALBUMS
      );
      setImagesMap(imagesMap);
      setImages(Object.values(Object.fromEntries(imagesMap)));
      setAlbums(imageAlbumMap);
    }
  }, [imagesData, env]);
  return <></>;
}
