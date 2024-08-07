import { useEffect, useLayoutEffect } from "react";
import { create } from "zustand";
import axios from "axios";
import { useImageState } from "./ImageState";
import { useSoundState } from "./SoundState";
import { convertCharaData } from "../data/functions/convertCharaData";
import { buildAddVer } from "../data/env";
const defaultUrl = "/json/characters.json" + buildAddVer;

type CharaStateType = {
  charaList: Array<CharaType>;
  charaObject: CharaObjectType;
  isSet: boolean;
  setIsSet: (flag: boolean) => void;
  setCharaObject: (list: CharaObjectType) => void;
  isReload: boolean;
  Reload: () => void;
};

export const useCharaState = create<CharaStateType>((set) => ({
  charaObject: {},
  charaList: [],
  isSet: false,
  setIsSet: (flag) => set(() => ({ isSet: flag })),
  setCharaObject: (data) => {
    set(() => ({
      charaList: Object.values(data) as CharaType[],
      charaObject: data,
      isSet: true,
      isReload: false,
    }));
  },
  isReload: true,
  Reload() {
    set(() => ({ isReload: true }));
  },
}));

export function CharaState({ url = defaultUrl }: { url?: string }) {
  const { setCharaObject, isReload, charaList } = useCharaState();
  const { imageItemList } = useImageState().imageObject;
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
                    album?.name === kindItem.name && name === chara.id
                );
              }
            });
          },
        });
        setCharaObject(data);
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
