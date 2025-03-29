import { useEffect, useState } from "react";
import { likeDataObject } from "./DataState";
import { CreateState } from "./CreateState";
import { useImageState } from "./ImageState";
import { useCharacters } from "./CharacterState";

export const useLikeStateUpdated = CreateState<string>();

export function LikeState() {
  return <></>;
}
