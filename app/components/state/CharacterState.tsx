import { type JSX, useEffect, useSyncExternalStore } from "react";
import { useImageState } from "./ImageState";
import { useSounds } from "./SoundState";
import { useEnv } from "./EnvState";
import { charactersDataIndexed } from "~/data/DataState";
import { CreateObjectState } from "./CreateState";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import { useLikeState } from "./LikeState";

export type mediaKindType = "icon" | "image" | "headerImage";
export const charaMediaKindMap: Map<mediaKindType, string> = new Map([
  ["icon", "charaIcon"],
  ["image", "charaImages"],
  ["headerImage", "headerImage"],
]);
export const charaMediaKindValues = Object.values(
  Object.fromEntries(charaMediaKindMap)
);

interface characterStateType {
  charactersData?: MeeIndexedDBTable<CharacterType>;
  charactersTags?: ContentsTagsOption[];
  charactersLikeData?: Map<string, LikeType>;
  charactersLabelOptions?: ContentsTagsOption[];
  charaFormatOptionLabel?: JSX.Element;
  characters: CharacterType[];
  charactersMap: Map<string, CharacterType>;
}
export const useCharacters = CreateObjectState<characterStateType>((set) => ({
  characters: [],
  charactersMap: new Map(),
}));

export function CharacterState() {
  return (
    <>
      <CharacterDataState />
    </>
  );
}

function CharacterDataState() {
  const charactersData = useSyncExternalStore(
    charactersDataIndexed.subscribe,
    () => charactersDataIndexed.table
  );
  const { Set } = useCharacters();
  const { imagesMap } = useImageState();
  const { sounds, defaultPlaylist } = useSounds();
  const { likeCategoryMap } = useLikeState();
  const env = useEnv()[0];
  useEffect(() => {
    if (
      charactersData.db &&
      sounds &&
      defaultPlaylist &&
      likeCategoryMap &&
      env
    ) {
      charactersData.getAll().then(async (characters) => {
        const charactersMap = new Map(
          characters.map((character) => [character.key, character])
        );
        characters.sort((a, b) => (a.order || 0) - (b.order || 0));
        const charaLikeData = likeCategoryMap.get("character");
        charactersMap.forEach((chara) => {
          if (charaLikeData) {
            const currentLikeData = charaLikeData.get(chara.key);
            if (currentLikeData) chara.like = currentLikeData;
          }
          chara.visible = Boolean(chara.image || chara.icon);

          if (sounds && defaultPlaylist) {
            let playlist = chara.playlist;
            if (playlist) {
              const playlistTitle = `${chara.name}のプレイリスト`;
              chara.soundPlaylist = {
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
        const tagOptionsMap = characters.reduce((a, c) => {
          c.tags?.forEach((tag) => {
            if (a.has(tag)) {
              const option = a.get(tag)!;
              option.count!++;
            } else if (tag) a.set(tag, { label: tag, value: tag, count: 1 });
          });
          return a;
        }, new Map<string, ContentsTagsOption>());
        const charactersTags = Object.values(Object.fromEntries(tagOptionsMap));
        Set({ charactersData, characters, charactersMap, charactersTags });
      });
    }
  }, [charactersData, sounds, defaultPlaylist, likeCategoryMap, env]);
  useEffect(() => {
    if (imagesMap) {
      Set(({ charactersMap, characters }) => {
        characters.forEach((chara) => {
          if (chara.rawdata) {
            charaMediaKindMap.forEach((name, key) => {
              const charaMediaItem = chara.rawdata![key];
              let image: ImageType | undefined;
              if (charaMediaItem) {
                image = imagesMap.get(charaMediaItem);
              } else if (name === "charaIcon") {
                image = imagesMap.get(chara.key);
              }
              if (image?.src) chara[key] = image;
              else chara[key] = null;
            });
          }
          return {
            characters: characters.concat(),
            charactersMap: new Map(charactersMap),
          };
        });
      });
    }
  }, [imagesMap]);
  return <></>;
}
