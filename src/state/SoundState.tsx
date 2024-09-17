import { useEffect, useLayoutEffect } from "react";
import { useSoundPlayer } from "./SoundPlayer";
import { atom, useAtom } from "jotai";
import { CreateState } from "./CreateState";
import { soundsDataObject } from "./DataState";

export const useSounds = CreateState<SoundItemType[]>();
export const useSoundAlbum = CreateState<SoundAlbumType>();
export const useSoundDefaultPlaylist = CreateState<SoundPlaylistType>();

const url = "/json/sound.json";

export function SoundState() {
  const setSounds = useSounds()[1];
  const setAlbum = useSoundAlbum()[1];
  const setDefaultPlaylist = useSoundDefaultPlaylist()[1];
  const load = soundsDataObject.useLoad()[0];
  const data = soundsDataObject.useData()[0];
  const RegistPlaylist = useSoundPlayer((state) => state.RegistPlaylist);
  useEffect(() => {
    console.log(data);
    setSounds([]);
  }, [data])
  useLayoutEffect(() => {
    if (load) {
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          const album = data as SoundAlbumType;
          setAlbum(album);
          setSounds(
            album.playlist?.reduce<SoundItemType[]>((a, c) => {
              c.list.forEach((s) => {
                a.push(s);
              });
              return a;
            }, [])
          );
          const setupPlaylist = album.playlist?.find((playlist) =>
            playlist.list.some((item) => item.setup)
          ) || { list: [] };
          if (setupPlaylist?.list.length > 0) {
            const defaultPlaylist = setupPlaylist;
            setDefaultPlaylist(defaultPlaylist);
            if (defaultPlaylist) {
              const setupSoundIndex = defaultPlaylist?.list.findIndex(
                (item) => item.setup
              );
              RegistPlaylist({
                playlist: defaultPlaylist,
                current: setupSoundIndex,
              });
            }
          }
        });
    }
  }, [load, setSounds, setAlbum, setDefaultPlaylist, RegistPlaylist]);
  return <></>;
}
