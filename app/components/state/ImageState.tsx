import { useEffect, useMemo, useSyncExternalStore } from "react";
import { imageDataIndexed, likeDataIndexed } from "~/data/DataState";
import {
  getImageAlbumMap,
  getImageObjectMap,
} from "~/components/functions/media/imageFunction";
import { CreateObjectState, CreateState } from "./CreateState";
import { ArrayEnv } from "~/Env";
import { findMeeSort, findMeeWheresFilter } from "~/data/find/findMee";
import { useLikeState } from "./LikeState";
import { ImageMeeIndexedDBTable } from "~/data/IndexedDB/IndexedDataLastmodMH";
import { getCountList } from "~/components/functions/arrayFunction";
import { useCharacters } from "./CharacterState";

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
  copyrightList?: ValueCountType[];
  tagsList?: ValueCountType[];
  simpleDefaultTags?: ContentsTagsOption[];
}
export const useImageState = CreateObjectState<imageStateType>();

export function ImageState() {
  const { Set } = useImageState();
  const { likeCategoryMap } = useLikeState();
  const { charactersMap } = useCharacters();
  const imagesData = useSyncExternalStore(
    imageDataIndexed.subscribe,
    () => imageDataIndexed.table
  );

  useEffect(() => {
    if (!imageDataIndexed.isUpgrade && charactersMap && likeCategoryMap) {
      imagesData.getAll().then((images) => {
        const imagesLikeData = likeCategoryMap.get("image");
        const lastmod = imageDataIndexed.beforeLastmod;
        const latest = imageDataIndexed.latest;
        images.forEach((image) => {
          if (lastmod)
            image.update = Boolean(
              image.lastmod!.getTime() > lastmod.getTime()
            );
          image.new =
            image.update &&
            (image.time && latest ? image.time > latest : false);
          image.characterObjects = image.characters
            ?.map((character) => charactersMap.get(character)!)
            .filter((c) => c);
          image.characterNameGuides = image.characterObjects?.map((chara) => {
            const values: string[] = [];
            if (chara.name) values.push(chara.name);
            if (chara.nameGuide) values.push(chara.nameGuide);
            return values.join(",");
          });
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
        const copyrightList = getCountList(images || [], "copyright");
        const tagsList = getCountList(images || [], "tags");
        Set({
          images,
          imagesMap,
          galleryAlbums,
          imageAlbums,
          imagesData,
          imagesLikeData,
          copyrightList,
          tagsList,
        });
      });
    }
  }, [imagesData, likeCategoryMap, charactersMap]);
  return <></>;
}

export const useSelectedImage = CreateState<ImageType | null>(null);
