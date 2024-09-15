import { useEffect } from "react";
import { useAtom } from "jotai";
import { EnvAtom } from "./EnvState";
import { imageDataObject } from "./DataState";
import { getImageObjectMap } from "@/functions/imageFunctions";
import { create } from "zustand";

type imageStateType = {
  images?: ImageType[];
  imagesMap?: Map<string, ImageType>;
  imageAlbums?: Map<string, ImageAlbumType>;
  set: (imagesData: ImageDataType[], albumEnv?: ImageAlbumEnvType[]) => void;
};
export const useImageState = create<imageStateType>((set) => ({
  set(data, albumEnv) {
    const { imagesMap, imageAlbumMap } = getImageObjectMap(data, albumEnv);
    imagesMap.forEach((image) => {
      image.update = Boolean(
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
    set({
      imagesMap,
      images: Object.values(Object.fromEntries(imagesMap)),
      imageAlbums: imageAlbumMap,
    });
  },
}));

export function ImageState() {
  const imagesData = useAtom(imageDataObject.dataAtom)[0];
  const env = useAtom(EnvAtom)[0];
  const { set } = useImageState();
  useEffect(() => {
    if (imagesData && env) set(imagesData, env?.IMAGE_ALBUMS);
  }, [imagesData, env, set]);
  return <></>;
}
