import { useLayoutEffect } from "react";
import { create } from "zustand";
import axios from "axios";
import { buildAddVer } from "../data/env";
import {
  getCopyRightList,
  getTagList,
  parseImageItems,
} from "../data/functions/images";
import { ImageClass } from "@/class/ImageClass";
const defaultUrl = "/json/images.json" + buildAddVer;

interface ValueCountType {
  value: string;
  count: number;
}

type ImageStateType = {
  imageObject: ImageClass;
  setImageObject: (imageObject: ImageClass) => void;
  setImageFromUrl: (url?: string) => void;
};

export const useImageState = create<ImageStateType>((set) => ({
  imageObject: new ImageClass(),
  setImageObject: (imageObject) => {
    set(() => ({ imageObject }));
  },
  setImageFromUrl: (url = defaultUrl) => {
    set((state) => {
      state.imageObject.setImageFromUrl(url).then(() => {
        state.setImageObject(state.imageObject);
      });
      return state;
    });
  },
}));

export function ImageState({ url }: { url?: string }) {
  const { setImageFromUrl } = useImageState();
  useLayoutEffect(() => {
    setImageFromUrl(url);
  }, [url]);
  return <></>;
}
