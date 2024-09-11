import { useLayoutEffect } from "react";
import { useSoundPlayer } from "./SoundPlayer";
import { atom, useAtom } from "jotai";

export const soundsAtom = atom<SoundItemType[]>();
export const soundAlbumAtom = atom<SoundAlbumType>();
export const soundDefaultPlaylistAtom = atom<SoundPlaylistType>();
export const soundLoadAtom = atom(true);

const url = "/json/sound.json";

export function SoundState() {
  const setSounds = useAtom(soundsAtom)[1];
  const setAlbum = useAtom(soundAlbumAtom)[1];
  const setDefaultPlaylist = useAtom(soundDefaultPlaylistAtom)[1];
  const [load, setLoad] = useAtom(soundLoadAtom);
  const RegistPlaylist = useSoundPlayer((state) => state.RegistPlaylist);
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
                console.log(s);
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
      setLoad(false);
    }
  }, [load, setLoad, setSounds, setAlbum, setDefaultPlaylist, RegistPlaylist]);
  return <></>;
}
