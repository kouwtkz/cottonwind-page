import { useCallback, useEffect, useLayoutEffect } from "react";
import { create } from "zustand";
import axios from "axios";
import { imagesAtom } from "./ImageState";
import { useSoundState } from "./SoundState";
import { convertCharaData } from "../data/functions/convertCharaData";
import { atom, useAtom } from "jotai";
import { pageIsCompleteAtom, siteIsFirstAtom } from "./StateSet";
import { ContentsTagsOption } from "@/components/dropdown/SortFilterTags";
import { ApiOriginAtom, EnvAtom } from "./EnvState";
import { StorageDataClass } from "@/functions/StorageDataClass";
import { getBasename } from "@/functions/doc/PathParse";
import { charactersDataAtom } from "./DataState";

export const charactersAtom = atom<CharacterType[]>();
export const charactersMapAtom = atom<Map<string, CharacterType>>();
export const characterTagsAtom = atom<ContentsTagsOption[]>([]);

{
  // const charaList = Object.values(data) as CharacterType[];
  // charaList.forEach((v) => {
  //   if (v.tags && !Array.isArray(v.tags)) v.tags = [v.tags];
  // });
  // const tagOptionsMap = charaList.reduce((a, c) => {
  //   c.tags?.forEach((tag) => {
  //     if (a.has(tag)) {
  //       const option = a.get(tag)!;
  //       option.count!++;
  //     } else a.set(tag, { label: tag, value: tag, count: 1 });
  //   });
  //   return a;
  // }, new Map<string, ContentsTagsOption>());
  // const charaTags = Object.values(Object.fromEntries(tagOptionsMap));
}

export function CharacterState() {
  const characterData = useAtom(charactersDataAtom)[0];
  const setCharacters = useAtom(charactersAtom)[1];
  const setCharactersMap = useAtom(charactersMapAtom)[1];
  const env = useAtom(EnvAtom)[0];
  useEffect(() => {
    if (characterData && env) {
      const charactersMap = new Map<string, CharacterType>();
      characterData.forEach((v) => {
        const item: CharacterType = {
          ...v,
          media: {},
          tags: v.tags ? v.tags.split(",") : [],
          playlist: [],
          birthday: v.birthday ? new Date(v.birthday) : undefined,
          time: v.time ? new Date(v.time) : undefined,
          lastmod: v.lastmod ? new Date(v.lastmod) : undefined,
        };
        const key = item.id;
        if (!charactersMap.has(key)) {
          charactersMap.set(key, item);
        }
      });
      setCharactersMap(charactersMap);
      setCharacters(Object.values(Object.fromEntries(charactersMap)));
    }
  }, [characterData, env]);
  // useLayoutEffect(() => {
  //   if (reset && imageItemList.length > 0) {
  //     axios(url).then((r) => {
  //       type mediaKindType = "icon" | "image" | "headerImage";
  //       const mediaKindArray: Array<{ kind: mediaKindType; name?: string }> = [
  //         { kind: "icon", name: "charaIcon" },
  //         { kind: "image", name: "charaImages" },
  //         { kind: "headerImage" },
  //       ];
  //       const data = convertCharaData({
  //         data: r.data,
  //         convert: (chara) => {
  //           if (!chara.media) chara.media = {};
  //           const charaMedia = chara.media;
  //           mediaKindArray.forEach((kindItem) => {
  //             const charaMediaItem = chara[kindItem.kind];
  //             if (charaMediaItem) {
  //               charaMedia[kindItem.kind] = imageItemList.find(({ src }) =>
  //                 src?.match(charaMediaItem)
  //               );
  //             } else if (kindItem.name) {
  //               charaMedia[kindItem.kind] = imageItemList.find(
  //                 ({ album, name }) =>
  //                   album === kindItem.name && name === chara.id
  //               );
  //             }
  //           });
  //         },
  //       });
  //       setCharaObject(data, url);
  //     });
  //   }
  // }, [isReload, imageItemList]);
  // useEffect(() => {
  //   if (charaList && SoundItemList.length > 0) {
  //     charaList.forEach((chara) => {
  //       let playlist = chara.playlist;
  //       if (playlist) {
  //         const playlistTitle = `${chara.name}のプレイリスト`;
  //         if (!chara.media) chara.media = {};
  //         chara.media.playlist = {
  //           title: playlistTitle,
  //           list: playlist
  //             .reduce((a, c) => {
  //               if (c === "default") {
  //                 defaultPlaylist?.list.forEach(({ src }) => {
  //                   const foundIndex = SoundItemList.findIndex(
  //                     (item) => item.src === src
  //                   );
  //                   if (foundIndex >= 0) a.push(foundIndex);
  //                 });
  //               } else {
  //                 const foundIndex = SoundItemList.findIndex((item) =>
  //                   item.src.endsWith(c)
  //                 );
  //                 if (foundIndex >= 0) a.push(foundIndex);
  //               }
  //               return a;
  //             }, [] as number[])
  //             .filter((i) => i >= 0)
  //             .map((i) => SoundItemList[i]),
  //         };
  //       }
  //     });
  //   }
  // }, [SoundItemList, charaList]);
  return <></>;
}
