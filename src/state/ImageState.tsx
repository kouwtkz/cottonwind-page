import { useLayoutEffect } from "react";
import { create } from "zustand";
import { ImageClass } from "@/class/ImageClass";
const defaultUrl = "/json/images.json";

interface ValueCountType {
  value: string;
  count: number;
}

type ImageStateType = {
  imageObject: ImageClass;
  url: string;
  setImageObject: (imageObject: ImageClass, url?: string) => void;
  setImageFromUrl: (url?: string) => void;
};

export const useImageState = create<ImageStateType>((set) => ({
  imageObject: new ImageClass(),
  url: "",
  setImageObject: (imageObject, url) => {
    set(() => ({ imageObject, url }));
  },
  setImageFromUrl: (url = defaultUrl) => {
    set((state) => {
      state.imageObject.setImageFromUrl(url).then(() => {
        state.setImageObject(state.imageObject, url);
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
