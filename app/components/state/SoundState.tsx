import { useEffect, useSyncExternalStore } from "react";
import { useSoundPlayer } from "~/components/layout/SoundPlayer";
import { CreateObjectState, CreateState } from "./CreateState";
import {
  soundsDataIndexed,
  soundAlbumsDataIndexed,
  waitIdb,
} from "~/data/ClientDBLoader";
import {
  getSoundAlbumsMap,
  getSoundsMap,
} from "~/components/functions/soundFunction";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import { ExternalStoreProps } from "~/data/IndexedDB/IndexedDataLastmodMH";

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
  const { RegistPlaylist } = useSoundPlayer();
  const soundsData = useSyncExternalStore(
    ...ExternalStoreProps(soundsDataIndexed)
  );
  const soundAlbumsData = useSyncExternalStore(
    ...ExternalStoreProps(soundAlbumsDataIndexed)
  );
  useEffect(() => {
    (async () => {
      await waitIdb;
      if (soundsData?.db && soundAlbumsData) {
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
        albums.forEach((album) => {
          album.playlist?.list.sort((a, b) => (a.track || 0) - (b.track || 0));
        });
        albums.sort((a, b) => (a.order || 0) - (b.order || 0));
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
      }
    })();
  }, [soundsData, soundAlbumsData, RegistPlaylist]);
  return <></>;
}
