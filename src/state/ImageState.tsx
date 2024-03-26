import { useEffect, useRef } from "react";
import { create } from "zustand";
import {
  MediaImageItemType,
  MediaImageAlbumType,
} from "../types/MediaImageDataType";
import axios from "axios";
import { buildAddVer } from "../data/env";
import {
  getCopyRightList,
  getTagList,
  parseImageItems,
} from "../data/functions/images";
const defaultUrl = "/static/data/images.json" + buildAddVer;

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

export default function ImageState({ url }: { url?: string }) {
  const { setImageFromUrl } = useImageState();
  const setImage = useRef(false);
  useEffect(() => {
    if (!setImage.current) setImageFromUrl(url);
    setImage.current = true;
  });

  return <></>;
}
