import { useEffect, useSyncExternalStore } from "react";
import { useSoundPlayer } from "~/components/layout/SoundPlayer";
import { CreateObjectState, CreateState } from "./CreateState";
import { soundsDataIndexed, soundAlbumsDataIndexed } from "~/data/ClientDBLoader";
import { getSoundAlbumsMap, getSoundsMap } from "~/components/functions/soundFunction";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";

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
    soundsDataIndexed?.subscribe || (() => () => {}),
    () => soundsDataIndexed?.table
  );
  const soundAlbumsData = useSyncExternalStore(
    soundAlbumsDataIndexed?.subscribe || (() => () => {}),
    () => soundAlbumsDataIndexed?.table
  );
  const { RegistPlaylist } = useSoundPlayer();
  useEffect(() => {
    if (soundsData?.db && soundAlbumsData) {
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
  return <></>;
}
