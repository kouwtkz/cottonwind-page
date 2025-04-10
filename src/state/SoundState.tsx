import { useEffect, useSyncExternalStore } from "react";
import { useSoundPlayer } from "./SoundPlayer";
import { CreateObjectState, CreateState } from "./CreateState";
import { soundsDataIndexed, soundAlbumsDataIndexed } from "@/data/DataState";
import { getSoundAlbumsMap, getSoundsMap } from "@/functions/soundFunction";
import { MeeIndexedDBTable } from "@/data/IndexedDB/MeeIndexedDB";

interface SoundsStateType {
  sounds: SoundItemType[];
  soundsMap: Map<string, SoundItemType>;
  soundAlbums: SoundAlbumType[];
  soundAlbumsMap: Map<string, SoundAlbumType>;
  defaultPlaylist?: SoundPlaylistType;
  soundsData?: MeeIndexedDBTable<SoundItemType>;
  soundAlbumsData?: MeeIndexedDBTable<SoundAlbumType>;
}
export const useSounds = CreateObjectState<SoundsStateType>({
  sounds: [],
  soundsMap: new Map(),
  soundAlbums: [],
  soundAlbumsMap: new Map(),
});

export function SoundState() {
  const { Set } = useSounds();
  const soundsData = useSyncExternalStore(
    soundsDataIndexed.subscribe,
    () => soundsDataIndexed.table
  );
  const soundAlbumsData = useSyncExternalStore(
    soundAlbumsDataIndexed.subscribe,
    () => soundAlbumsDataIndexed.table
  );
  const { RegistPlaylist } = useSoundPlayer();
  useEffect(() => {
    if (soundsData.db && soundAlbumsData) {
      (async () => {
        const sounds = await soundsData.getAll();
        const soundsMap = new Map(sounds.map((v) => [v.key, v]));
        const soundAlbums = await soundAlbumsData.getAll();
        const soundAlbumsMap = new Map(soundAlbums.map((v) => [v.key, v]));
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
        Set({
          soundsData,
          sounds,
          soundsMap,
          soundAlbumsData,
          soundAlbums,
          soundAlbumsMap,
        });
        if (defaultPlaylist) {
          Set({ defaultPlaylist });
          RegistPlaylist({ playlist: defaultPlaylist });
        }
      })();
    }
  }, [soundsData, soundAlbumsData, RegistPlaylist]);
  // useEffect(() => {
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
