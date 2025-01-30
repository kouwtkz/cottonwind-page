import { useEffect } from "react";
import { imageDataObject } from "./DataState";
import { getImageObjectMap } from "@/functions/media/imageFunction";
import { create } from "zustand";
import { CreateState } from "./CreateState";
import { ArrayEnv } from "@/ArrayEnv";

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
  const imagesData = imageDataObject.useData()[0];
  const { set } = useImageState();
  useEffect(() => {
    if (imagesData) set(imagesData, ArrayEnv.IMAGE_ALBUMS);
  }, [imagesData, set]);
  return <></>;
}

export const useSelectedImage = CreateState<ImageType | null>(null);
