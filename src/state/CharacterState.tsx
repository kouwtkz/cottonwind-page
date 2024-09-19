import { useEffect } from "react";
import { useImageState } from "./ImageState";
import { useSoundDefaultPlaylist, useSounds } from "./SoundState";
import { ContentsTagsOption } from "@/components/dropdown/SortFilterTags";
import { useEnv } from "./EnvState";
import { charactersDataObject } from "./DataState";
import { getCharacterMap as getCharactersMap } from "@/functions/characterFunction";
import { CreateState } from "./CreateState";

export const useCharacters = CreateState<CharacterType[]>();
export const useCharactersMap = CreateState<Map<string, CharacterType>>();
export const useCharacterTags = CreateState<ContentsTagsOption[]>();

export type mediaKindType = "icon" | "image" | "headerImage";
export const charaMediaKindMap: Map<mediaKindType, string> = new Map([
  ["icon", "charaIcon"],
  ["image", "charaImages"],
  ["headerImage", "headerImage"],
]);

export function CharacterState() {
  const characterData = charactersDataObject.useData()[0];
  const setCharacters = useCharacters()[1];
  const setCharactersMap = useCharactersMap()[1];
  const { imagesMap } = useImageState();
  const sounds = useSounds()[0];
  const defaultPlaylist = useSoundDefaultPlaylist()[0];
  const env = useEnv()[0];
  const setCharacterTags = useCharacterTags()[1];
  useEffect(() => {
    if (imagesMap && characterData && env) {
      const charactersMap = getCharactersMap(characterData);
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
        chara.visible = Boolean(chara.media.image || chara.media.icon);

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
                    const foundIndex = sounds.findIndex(
                      (item) => item.key === c
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
      characters.sort((a, b) => (a.order || 0) - (b.order || 0));
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
