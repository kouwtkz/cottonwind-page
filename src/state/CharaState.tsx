import { HTMLAttributes, useEffect } from "react";
import { CharaType, CharaObjectType } from "../types/CharaType";
import { create } from "zustand";
import axios from "axios";
import { useImageState } from "./ImageState";
import { useSoundState } from "./SoundState";
import GalleryList from "../components/image/GalleryList";
import { convertCharaData } from "../data/functions/convertCharaData";
import { buildAddVer } from "../data/env";
const defaultUrl = "/static/data/characters.json" + buildAddVer;

type CharaStateType = {
  charaList: Array<CharaType>;
  charaObject: CharaObjectType | null;
  isSet: boolean;
  setIsSet: (flag: boolean) => void;
  setCharaObject: (list: CharaObjectType) => void;
};

export const useCharaState = create<CharaStateType>((set) => ({
  charaObject: null,
  charaList: [],
  isSet: false,
  setIsSet: (flag) => set(() => ({ isSet: flag })),
  setCharaObject: (data) => {
    set(() => ({
      charaList: Object.values(data),
      charaObject: data,
      isSet: true,
    }));
  },
}));

export default function CharaState({ url = defaultUrl }: { url?: string }) {
  const { isSet, setCharaObject } = useCharaState();
  const { imageItemList, imageAlbumList } = useImageState();
  const { SoundItemList, defaultPlaylist } = useSoundState();
  useEffect(() => {
    if (!isSet && imageItemList.length > 0 && SoundItemList.length > 0) {
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
            let playlist = chara.playlist;
            if (playlist) {
              const playlistTitle = `${chara.name}のプレイリスト`;
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
          },
        });
        setCharaObject(data);
      });
    }
  });

  return <></>;
}

export interface CharaGalleryAlbumProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  chara: CharaType;
  label?: string;
  max?: number;
}

export function CharaGalleryAlbum({
  name,
  label,
  chara,
  max = 20,
  ...args
}: CharaGalleryAlbumProps) {
  const { imageAlbumList } = useImageState();
  if (!name || imageAlbumList.length === 0) return <></>;
  const matchAlbum = imageAlbumList.find((album) => album.name === name);
  if (!matchAlbum) return <></>;
  const album = {
    ...matchAlbum,
    list: matchAlbum.list.filter((item) =>
      item.tags?.some((v) => v === chara.id)
    ),
  };
  if (album.list.length === 0) return <></>;
  return (
    <GalleryList
      album={album}
      label={label}
      tags={chara.id}
      autoDisable={true}
      max={max}
      filterButton={true}
      {...args}
    />
  );
}
