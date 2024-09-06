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

export const charactersIsSet = atom(false);
export const charactersAtom = atom<CharacterType[]>([]);
export const charactersMapAtom = atom<Map<string, CharacterType>>();
export const characterTagsAtom = atom<ContentsTagsOption[]>([]);
export const charactersResetAtom = atom(true);

const StorageData = new StorageDataClass<CharacterDataType[]>(
  "characters",
  "1.1.2"
);

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

export function CharaState() {
  const [isSet, setIsSet] = useAtom(charactersIsSet);
  const setCharacters = useAtom(charactersAtom)[1];
  const setCharactersMap = useAtom(charactersMapAtom)[1];
  const setCharacterTags = useAtom(characterTagsAtom)[1];
  const [reset, setReset] = useAtom(charactersResetAtom);
  const apiOrigin = useAtom(ApiOriginAtom)[0];
  const env = useAtom(EnvAtom)[0];
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
  const callback = useCallback(async () => {
    if (env && apiOrigin) {
      const Url = new URL("/character/data", apiOrigin);
      const { data: sData, endpoint: sEndpoint } = StorageData;
      if (sEndpoint) Url.searchParams.set("endpoint", sEndpoint);
      await fetch(Url.href)
        .then(async (r) => (await r.json()) as CharacterDataType[])
        .then((data) => {
          if (sData) {
            data.forEach((d) => {
              const index = sData.findIndex(({ index }) => index === d.index);
              if (index >= 0) {
                sData[index] = d;
              } else {
                sData.push(d);
              }
            });
            data = sData;
          }
          StorageData.setItem(
            data,
            data.reduce((a, { mtime = "" }) => (a > mtime ? a : mtime), "")
          );
          const charactersMap = new Map<string, CharacterType>();
          data.forEach((v) => {
            const item: CharacterType = {
              ...v,
              media: {},
              tags: v.tags ? v.tags.split(",") : [],
              playlist: [],
              birthday: v.birthday ? new Date(v.birthday) : undefined,
              time: v.time ? new Date(v.time) : undefined,
              mtime: v.mtime ? new Date(v.mtime) : undefined,
            };
            const key = item.id;
            if (!charactersMap.has(key)) {
              charactersMap.set(key, item);
            }
          });
          setCharactersMap(charactersMap);
          setCharacters(Object.values(Object.fromEntries(charactersMap)));
        });
      return true;
    } else {
      return false;
    }
  }, [apiOrigin, setIsSet, env]);
  useEffect(() => {
    if (reset) {
      callback().then((result) => {
        if (result) {
          setIsSet(true);
          setReset(false);
        }
      });
    }
  }, [reset, setReset, callback]);
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
