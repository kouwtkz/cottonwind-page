import { useEffect } from "react";
import { imagesAtom } from "./ImageState";
import { soundDefaultPlaylistAtom, soundsAtom } from "./SoundState";
import { atom, useAtom } from "jotai";
import { ContentsTagsOption } from "@/components/dropdown/SortFilterTags";
import { EnvAtom } from "./EnvState";
import { charactersDataAtom } from "./DataState";
import { getCharacterMap } from "@/functions/characterFunctions";

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
  const [characters, setCharacters] = useAtom(charactersAtom);
  const setCharactersMap = useAtom(charactersMapAtom)[1];
  const images = useAtom(imagesAtom)[0];
  const sounds = useAtom(soundsAtom)[0];
  const defaultPlaylist = useAtom(soundDefaultPlaylistAtom)[0];
  const env = useAtom(EnvAtom)[0];
  useEffect(() => {
    if (images && characterData && env) {
      const charactersMap = getCharacterMap(characterData);
      type mediaKindType = "icon" | "image" | "headerImage";
      const mediaKindArray: Array<{ kind: mediaKindType; name?: string }> = [
        { kind: "icon", name: "charaIcon" },
        { kind: "image", name: "charaImages" },
        { kind: "headerImage" },
      ];
      charactersMap.forEach((chara) => {
        if (!chara.media) chara.media = {};
        const charaMedia = chara.media;
        mediaKindArray.forEach((kindItem) => {
          const charaMediaItem = chara[kindItem.kind];
          if (charaMediaItem) {
            charaMedia[kindItem.kind] = images.find(({ src }) =>
              src?.match(charaMediaItem)
            );
          } else if (kindItem.name) {
            charaMedia[kindItem.kind] = images.find(
              ({ album, name }) => album === kindItem.name && name === chara.id
            );
          }
        });

        if (sounds && defaultPlaylist) {
          charactersMap.forEach((chara) => {
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
                        const foundIndex = sounds.findIndex(
                          (item) => item.src === src
                        );
                        if (foundIndex >= 0) a.push(foundIndex);
                      });
                    } else {
                      const foundIndex = sounds.findIndex((item) =>
                        item.src.endsWith(c)
                      );
                      if (foundIndex >= 0) a.push(foundIndex);
                    }
                    return a;
                  }, [] as number[])
                  .filter((i) => i >= 0)
                  .map((i) => sounds[i]),
              };
            }
          });
        }
      });
      setCharactersMap(charactersMap);
      setCharacters(Object.values(Object.fromEntries(charactersMap)));
    }
  }, [characterData, images, sounds, defaultPlaylist, env]);
  return <></>;
}
