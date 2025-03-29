import { useEffect, useMemo } from "react";
import { imageDataObject, likeDataObject } from "./DataState";
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
};
export const useImageState = CreateObjectState<imageStateType>();

export function ImageState() {
  const imagesData = imageDataObject.useData()[0];
  const { Set } = useImageState();
  const likeData = likeDataObject.useData()[0];
  const imageLikeData = useMemo(() => {
    const list = likeData
      ?.filter((v) => v.path?.startsWith("?image="))
      .map<[string, LikeType]>((like) => [like.path!.slice(7), like]);
    if (list) return new Map(list);
  }, [likeData]);
  useEffect(() => {
    if (imagesData && imageLikeData) {
      const albumEnv = ArrayEnv.IMAGE_ALBUMS;
      const { imagesMap, imageAlbumMap: imageAlbums } = getImageObjectMap(
        imagesData,
        albumEnv
      );
      imagesMap.forEach((image) => {
        const like = imageLikeData.get(image.key);
        if (like) image.like = like;
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
      Set({
        imagesMap,
        images: Object.values(Object.fromEntries(imagesMap)),
        imageAlbums,
        galleryAlbums,
      });
    }
  }, [imagesData, imageLikeData]);
  return <></>;
}

export const useSelectedImage = CreateState<ImageType | null>(null);
