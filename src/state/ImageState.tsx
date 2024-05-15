import { useLayoutEffect } from "react";
import { create } from "zustand";
import axios from "axios";
import { buildAddVer } from "../data/env";
import {
  getCopyRightList,
  getTagList,
  parseImageItems,
} from "../data/functions/images";
const defaultUrl = "/json/images.json" + buildAddVer;

interface ValueCountType {
  value: string;
  count: number;
}

type ImageDataType = {
  imageItemList: Array<MediaImageItemType>;
  imageAlbumList: Array<MediaImageAlbumType>;
  tagList: ValueCountType[];
  copyrightList: ValueCountType[];
  isSet: boolean;
  setImageAlbum: (albumList: Array<MediaImageAlbumType>) => void;
  setImageFromUrl: (url?: string) => void;
};

export const useImageState = create<ImageDataType>((set) => ({
  imageItemList: [],
  imageAlbumList: [],
  tagList: [],
  copyrightList: [],
  isSet: false,
  setImageAlbum: (data) => {
    const imageItemList = parseImageItems(data);
    const tagList = getTagList(imageItemList);
    const copyrightList = getCopyRightList(imageItemList);
    set(() => ({
      imageAlbumList: data,
      imageItemList,
      tagList,
      copyrightList,
      isSet: true,
    }));
  },
  setImageFromUrl: (url = defaultUrl) => {
    set((state) => {
      axios(url).then((r) => {
        state.setImageAlbum(r.data);
      });
      return state;
    });
  },
}));

export function ImageState({ url }: { url?: string }) {
  const setImageFromUrl = useImageState((state) => state.setImageFromUrl);
  useLayoutEffect(() => {
    setImageFromUrl(url);
  }, [url]);
  return <></>;
}
