import { useEffect } from "react";
import { useSoundPlayer } from "./SoundPlayer";
import { CreateState } from "./CreateState";
import { soundAlbumsDataObject, soundsDataObject } from "./DataState";
import { getSoundAlbumsMap, getSoundsMap } from "@/functions/soundFunction";

export const useSounds = CreateState<SoundItemType[]>();
export const useSoundsMap = CreateState<Map<string, SoundItemType>>();
export const useSoundAlbums = CreateState<SoundAlbumType[]>();
export const useSoundAlbumsMap = CreateState<Map<string, SoundAlbumType>>();
export const useSoundDefaultPlaylist = CreateState<SoundPlaylistType>();

export function SoundState() {
  const setSounds = useSounds()[1];
  const setSoundsMap = useSoundsMap()[1];
  const setSoundAlbums = useSoundAlbums()[1];
  const setSoundAlbumsMap = useSoundAlbumsMap()[1];
  const setDefaultPlaylist = useSoundDefaultPlaylist()[1];
  const data = soundsDataObject.useData()[0];
  const albumData = soundAlbumsDataObject.useData()[0];
  const { RegistPlaylist } = useSoundPlayer();
  useEffect(() => {
    if (data && albumData) {
      const soundsMap = getSoundsMap(data);
      const sounds = Object.values(Object.fromEntries(soundsMap));
      const soundAlbumsMap = getSoundAlbumsMap(albumData);
      sounds.forEach((sound) => {
        if (sound.album) {
          if (!soundAlbumsMap.has(sound.album)) {
            soundAlbumsMap.set(sound.album, { key: sound.album });
          }
          const album = soundAlbumsMap.get(sound.album)!;
          if (!album.playlist)
            album.playlist = { list: [], title: album.title || album.key };
          album.playlist.list.push(sound);
        }
      });
      const albums = Object.values(Object.fromEntries(soundAlbumsMap));
      const defaultPlaylist =
        albums.find((album) => album.setup && false)?.playlist ||
        albums[0]?.playlist;
      setSounds(sounds);
      setSoundsMap(soundsMap);
      setSoundAlbums(albums);
      setSoundAlbumsMap(soundAlbumsMap);
      if (defaultPlaylist) {
        setDefaultPlaylist(defaultPlaylist);
        RegistPlaylist({ playlist: defaultPlaylist });
      }
    }
  }, [
    data,
    albumData,
    setSounds,
    setSoundsMap,
    setSoundAlbums,
    setSoundAlbumsMap,
    setDefaultPlaylist,
    RegistPlaylist,
  ]);
  //   if (load) {
  //     fetch(url)
  //       .then((r) => r.json())
  //       .then((data) => {
  //         const album = data as SoundAlbumType;
  //         setAlbum(album);
  //         setSounds(
  //           album.playlist?.reduce<SoundItemType[]>((a, c) => {
  //             c.list.forEach((s) => {
  //               a.push(s);
  //             });
  //             return a;
  //           }, [])
  //         );
  //         const setupPlaylist = album.playlist?.find((playlist) =>
  //           playlist.list.some((item) => item.setup)
  //         ) || { list: [] };
  //         if (setupPlaylist?.list.length > 0) {
  //           const defaultPlaylist = setupPlaylist;
  //           setDefaultPlaylist(defaultPlaylist);
  //           if (defaultPlaylist) {
  //             const setupSoundIndex = defaultPlaylist?.list.findIndex(
  //               (item) => item.setup
  //             );
  //             RegistPlaylist({
  //               playlist: defaultPlaylist,
  //               current: setupSoundIndex,
  //             });
  //           }
  //         }
  //       });
  //   }
  // }, [load, setSounds, setAlbum, setDefaultPlaylist, RegistPlaylist]);
  return <></>;
}
