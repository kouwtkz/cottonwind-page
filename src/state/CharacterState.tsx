import { useEffect } from "react";
import { imagesMapAtom } from "./ImageState";
import { soundDefaultPlaylistAtom, soundsAtom } from "./SoundState";
import { atom, useAtom } from "jotai";
import { ContentsTagsOption } from "@/components/dropdown/SortFilterTags";
import { EnvAtom } from "./EnvState";
import { charactersDataAtom } from "./DataState";
import { getCharacterMap } from "@/functions/characterFunctions";

export const charactersAtom = atom<CharacterType[]>();
export const charactersMapAtom = atom<Map<string, CharacterType>>();
export const characterTagsAtom = atom<ContentsTagsOption[]>([]);

export type mediaKindType = "icon" | "image" | "headerImage";
export const charaMediaKindMap: Map<mediaKindType, string> = new Map([
  ["icon", "charaIcon"],
  ["image", "charaImages"],
  ["headerImage", "headerImage"],
]);

export function CharacterState() {
  const characterData = useAtom(charactersDataAtom)[0];
  const [characters, setCharacters] = useAtom(charactersAtom);
  const setCharactersMap = useAtom(charactersMapAtom)[1];
  const imagesMap = useAtom(imagesMapAtom)[0];
  const sounds = useAtom(soundsAtom)[0];
  const defaultPlaylist = useAtom(soundDefaultPlaylistAtom)[0];
  const env = useAtom(EnvAtom)[0];
  const setCharacterTags = useAtom(characterTagsAtom)[1];
  useEffect(() => {
    if (imagesMap && characterData && env) {
      const charactersMap = getCharacterMap(characterData);
      charactersMap.forEach((chara) => {
        if (!chara.media) chara.media = {};
        const charaMedia = chara.media;
        charaMediaKindMap.forEach((name, key) => {
          const charaMediaItem = chara[key];
          if (charaMediaItem) {
            charaMedia[key] = imagesMap.get(charaMediaItem);
          } else if (name === "charaIcon") {
            charaMedia[key] = imagesMap.get(chara.key);
          }
        });

        if (sounds && defaultPlaylist) {
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
        }
      });
      setCharactersMap(charactersMap);
      const characters = Object.values(Object.fromEntries(charactersMap));
      setCharacters(characters);
      const tagOptionsMap = characters.reduce((a, c) => {
        c.tags?.forEach((tag) => {
          if (a.has(tag)) {
            const option = a.get(tag)!;
            option.count!++;
          } else a.set(tag, { label: tag, value: tag, count: 1 });
        });
        return a;
      }, new Map<string, ContentsTagsOption>());
      const characterTags = Object.values(Object.fromEntries(tagOptionsMap));
      setCharacterTags(characterTags);
    }
  }, [
    characterData,
    imagesMap,
    sounds,
    defaultPlaylist,
    setCharacterTags,
    env,
  ]);
  return <></>;
}
