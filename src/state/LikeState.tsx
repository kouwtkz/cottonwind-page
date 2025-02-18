import { useEffect } from "react";
import { likeDataObject } from "./DataState";
import { CreateState } from "./CreateState";
import { useImageState } from "./ImageState";
import { useCharacters } from "./CharacterState";

export function LikeState() {
  const likeData = likeDataObject.useData()[0];
  const { images } = useImageState();
  useEffect(() => {
    if (images && likeData) {
      likeData
        .filter((v) => v.path?.startsWith("?image="))
        .map((like) => ({ like, key: like.path!.slice(7) }))
        .forEach(({ like, key }) => {
          const foundImage = images.find((image) => image.key === key);
          if (foundImage) {
            foundImage.like = like;
          }
        });
    }
  }, [images, likeData]);
  const characters = useCharacters()[0];
  useEffect(() => {
    if (characters && likeData) {
      likeData
        .filter((v) => v.path?.startsWith("/character/"))
        .map((like) => ({ like, key: like.path!.slice(11) }))
        .forEach(({ like, key }) => {
          const found = characters.find((item) => item.key === key);
          if (found) {
            found.like = like;
          }
        });
    }
  }, [characters, likeData]);
  return <></>;
}

export const useSelectedImage = CreateState<ImageType | null>(null);
