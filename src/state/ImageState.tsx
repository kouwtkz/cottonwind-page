import { useEffect, useMemo, useSyncExternalStore } from "react";
import { imageDataIndexed, likeDataIndexed } from "@/data/DataState";
import {
  getImageAlbumMap,
  getImageObjectMap,
} from "@/functions/media/imageFunction";
import { CreateObjectState, CreateState } from "./CreateState";
import { ArrayEnv } from "@/Env";
import { findMee } from "@/functions/find/findMee";
import { useLikeState } from "./LikeState";
import { ImageMeeIndexedDBTable } from "@/data/IndexedDB/IndexedDataLastmodMH";

const galleryList =
  ArrayEnv.IMAGE_ALBUMS?.map((album) => ({
    ...album.gallery?.pages,
    ...album,
  })).filter((v) => v) ?? [];

interface imageStateType {
  images?: Array<ImageType>;
  imagesMap?: Map<string, ImageType>;
  imagesData?: ImageMeeIndexedDBTable;
  imageAlbums?: Map<string, ImageAlbumType>;
  galleryAlbums?: Array<ImageAlbumEnvType>;
  imagesLikeData?: Map<string, LikeType>;
}
export const useImageState = CreateObjectState<imageStateType>();

export function ImageState() {
  const { Set } = useImageState();
  const { likeCategoryMap } = useLikeState();
  const imagesData = useSyncExternalStore(
    imageDataIndexed.subscribe,
    () => imageDataIndexed.table
  );
  useEffect(() => {
    if (imagesData.db && !imageDataIndexed.isBusy && likeCategoryMap) {
      imagesData.getAll().then((images) => {
        const imagesLikeData = likeCategoryMap.get("image");
        images.forEach((image) => {
          if (imagesLikeData?.has(image.key))
            image.like = imagesLikeData.get(image.key)!;
        });
        const imagesMap = new Map(images.map((image) => [image.key, image]));
        const albums = findMee(images, {
          direction: "prevunique",
          index: "album",
        })
          .filter((image) => image.album)
          .map((image) => image.album!);
        const galleryAlbums = galleryList.concat();
        const imageAlbums = getImageAlbumMap(ArrayEnv.IMAGE_ALBUMS, albums);
        Array.from(imageAlbums.values()).forEach((album) => {
          album.list = findMee(images, {
            index: "album",
            query: album.name,
            where: { src: { has: true } },
          });
        });
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
        Set({
          images,
          imagesMap,
          galleryAlbums,
          imageAlbums,
          imagesData,
          imagesLikeData,
        });
      });
    }
  }, [imagesData, likeCategoryMap]);
  return <></>;
}

export const useSelectedImage = CreateState<ImageType | null>(null);
