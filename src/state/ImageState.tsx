import { useEffect } from "react";
import { imageDataObject } from "./DataState";
import { getImageObjectMap } from "@/functions/media/imageFunction";
import { CreateObjectState, CreateState } from "./CreateState";
import { ArrayEnv } from "@/Env";

const galleryList =
  ArrayEnv.IMAGE_ALBUMS?.map((album) => ({
    ...album.gallery?.pages,
    ...album,
  })).filter((v) => v) ?? [];

type imageStateType = {
  images?: ImageType[];
  imagesMap?: Map<string, ImageType>;
  imageAlbums?: Map<string, ImageAlbumType>;
  galleryAlbums?: Array<ImageAlbumEnvType>;
  setImages: (
    imagesData: ImageDataType[],
    albumEnv?: ImageAlbumEnvType[]
  ) => void;
};
export const useImageState = CreateObjectState<imageStateType>((set) => ({
  setImages(data, albumEnv) {
    const { imagesMap, imageAlbumMap: imageAlbums } = getImageObjectMap(
      data,
      albumEnv
    );
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
    const galleryAlbums = galleryList.concat();
    if (imageAlbums) {
      Object.entries(Object.fromEntries(imageAlbums)).forEach(([k, v]) => {
        if (v.name === "pickup") return;
        const found = galleryAlbums.find((item) => item.name === k);
        if (!found) {
          galleryAlbums.push({
            name: k,
            hide: true,
            hideWhenEmpty: true,
            list: v.list,
          });
        } else {
          if (v.gallery?.generate) found.linkLabel = true;
          found.list = v.list;
        }
      });
    }
    set({
      imagesMap,
      images: Object.values(Object.fromEntries(imagesMap)),
      imageAlbums,
      galleryAlbums,
    });
  },
}));

export function ImageState() {
  const imagesData = imageDataObject.useData()[0];
  const { setImages } = useImageState();
  useEffect(() => {
    if (imagesData) setImages(imagesData, ArrayEnv.IMAGE_ALBUMS);
  }, [imagesData, setImages]);
  return <></>;
}

export const useSelectedImage = CreateState<ImageType | null>(null);
