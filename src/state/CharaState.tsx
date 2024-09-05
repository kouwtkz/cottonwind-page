import { useEffect, useLayoutEffect } from "react";
import { create } from "zustand";
import axios from "axios";
import { imagesAtom } from "./ImageState";
import { useSoundState } from "./SoundState";
import { convertCharaData } from "../data/functions/convertCharaData";
import { useAtom } from "jotai";
import { pageIsCompleteAtom, siteIsFirstAtom } from "./DataState";
import { ContentsTagsOption } from "@/components/dropdown/SortFilterTags";
const defaultUrl = "/json/characters.json";

type CharaStateType = {
  charaList: CharaType[];
  charaObject: CharaObjectType;
  charaTags: ContentsTagsOption[];
  url: string;
  isSet: boolean;
  setIsSet: (flag: boolean) => void;
  setCharaList: (list: CharaType[]) => void;
  setCharaObject: (data: CharaObjectType, url?: string) => void;
  isReload: boolean;
  Reload: () => void;
};

export const useCharaState = create<CharaStateType>((set) => ({
  charaObject: {},
  charaList: [],
  charaTags: [],
  url: "",
  isSet: false,
  setIsSet: (flag) => set(() => ({ isSet: flag })),
  setCharaList(list) {
    set({
      charaList: list,
    });
  },
  setCharaObject: (data, url) => {
    const charaList = Object.values(data) as CharaType[];
    charaList.forEach((v) => {
      if (v.tags && !Array.isArray(v.tags)) v.tags = [v.tags];
    });
    const tagOptionsMap = charaList.reduce((a, c) => {
      c.tags?.forEach((tag) => {
        if (a.has(tag)) {
          const option = a.get(tag)!;
          option.count!++;
        } else a.set(tag, { label: tag, value: tag, count: 1 });
      });
      return a;
    }, new Map<string, ContentsTagsOption>());
    const charaTags = Object.values(Object.fromEntries(tagOptionsMap));
    set({
      charaList,
      charaObject: data,
      charaTags,
      isSet: true,
      isReload: false,
      url,
    });
  },
  isReload: true,
  Reload() {
    set(() => ({ isReload: true }));
  },
}));

export function CharaState({ url = defaultUrl }: { url?: string }) {
  const { setCharaObject, isReload, charaList, isSet } = useCharaState();
  const setIsComplete = useAtom(pageIsCompleteAtom)[1];
  const [isFirst] = useAtom(siteIsFirstAtom);
  useEffect(() => {
    if (isFirst) setIsComplete(false);
  }, [isFirst]);
  useEffect(() => {
    if (isFirst && isSet) setIsComplete(true);
  }, [isSet, isFirst]);
  const imageItemList = useAtom(imagesAtom)[0];
  const { SoundItemList, defaultPlaylist } = useSoundState();
  useLayoutEffect(() => {
    if (isReload && imageItemList.length > 0) {
      axios(url).then((r) => {
        type mediaKindType = "icon" | "image" | "headerImage";
        const mediaKindArray: Array<{ kind: mediaKindType; name?: string }> = [
          { kind: "icon", name: "charaIcon" },
          { kind: "image", name: "charaImages" },
          { kind: "headerImage" },
        ];
        const data = convertCharaData({
          data: r.data,
          convert: (chara) => {
            if (!chara.media) chara.media = {};
            const charaMedia = chara.media;
            mediaKindArray.forEach((kindItem) => {
              const charaMediaItem = chara[kindItem.kind];
              if (charaMediaItem) {
                charaMedia[kindItem.kind] = imageItemList.find(({ URL }) =>
                  URL?.match(charaMediaItem)
                );
              } else if (kindItem.name) {
                charaMedia[kindItem.kind] = imageItemList.find(
                  ({ album, name }) =>
                    album === kindItem.name && name === chara.id
                );
              }
            });
          },
        });
        setCharaObject(data, url);
      });
    }
  }, [isReload, imageItemList]);
  useEffect(() => {
    if (charaList && SoundItemList.length > 0) {
      charaList.forEach((chara) => {
        let playlist = chara.playlist;
        if (playlist) {
          const playlistTitle = `${chara.name}のプレイリスト`;
          if (!chara.media) chara.media = {};
          chara.media.playlist = {
            title: playlistTitle,
            list: playlist
              .reduce((a, c) => {
                if (c === "default") {
                  defaultPlaylist?.list.forEach(({ src }) => {
                    const foundIndex = SoundItemList.findIndex(
                      (item) => item.src === src
                    );
                    if (foundIndex >= 0) a.push(foundIndex);
                  });
                } else {
                  const foundIndex = SoundItemList.findIndex((item) =>
                    item.src.endsWith(c)
                  );
                  if (foundIndex >= 0) a.push(foundIndex);
                }
                return a;
              }, [] as number[])
              .filter((i) => i >= 0)
              .map((i) => SoundItemList[i]),
          };
        }
      });
    }
  }, [SoundItemList, charaList]);
  return <></>;
}
