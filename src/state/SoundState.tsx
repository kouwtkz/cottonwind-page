import { create } from "zustand";
import { useEffect, useLayoutEffect } from "react";
import axios from "axios";
import { useSoundPlayer } from "./SoundPlayer";
const defaultUrl = "/json/sound.json";

function parseSoundItems(soundAlbum: SoundAlbumType) {
  const soundList: SoundItemType[] = [];
  soundAlbum.playlist?.forEach((playlist) => {
    playlist.list.forEach((item) => {
      soundList.push(item);
    });
  });
  return soundList;
}
interface SoundDataType {
  isSet: boolean;
  SoundAlbum: SoundAlbumType | null;
  SoundItemList: Array<SoundItemType>;
  defaultPlaylist: SoundPlaylistType | null;
  SetSoundAlbum: (album: SoundAlbumType) => void;
  SetDefaultPlaylist: (playlist: SoundPlaylistType) => void;
}

export const useSoundState = create<SoundDataType>((set) => ({
  isSet: false,
  SoundAlbum: null,
  SoundItemList: [],
  defaultPlaylist: null,
  SetSoundAlbum(data) {
    set(() => ({
      SoundAlbum: data,
      SoundItemList: parseSoundItems(data),
      isSet: true,
    }));
  },
  SetDefaultPlaylist(playlist) {
    set(() => ({
      defaultPlaylist: playlist,
    }));
  },
}));

export function SoundState({ url = defaultUrl }: { url?: string }) {
  const { isSet, SetSoundAlbum, SetDefaultPlaylist } =
    useSoundState();
  const RegistPlaylist = useSoundPlayer((state) => state.RegistPlaylist);
  useLayoutEffect(() => {
    if (!isSet) {
      axios(url).then((r) => {
        const album = r.data as SoundAlbumType;
        SetSoundAlbum(album);
        const setupPlaylist = album.playlist?.find((playlist) =>
          playlist.list.some((item) => item.setup)
        ) || { list: [] };
        if (setupPlaylist?.list.length > 0) {
          const defaultPlaylist = setupPlaylist;
          SetDefaultPlaylist(defaultPlaylist);
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
  }, []);
  return <></>;
}
