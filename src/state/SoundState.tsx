import { create } from "zustand";
import {
  PlaylistType,
  SoundAlbumType,
  SoundItemType,
} from "../types/MediaSoundType";
import { useEffect, useRef } from "react";
import axios from "axios";
import { useSoundPlayer } from "./SoundPlayer";
import { buildAddVer } from "../data/env";
const defaultUrl = "/static/data/sound.json" + buildAddVer;

function parseSoundItems(soundAlbum: SoundAlbumType) {
  const soundList: SoundItemType[] = [];
  soundAlbum.playlist?.forEach((playlist) => {
    playlist.list.forEach((item) => {
      soundList.push(item);
    });
  });
  return soundList;
}
type SoundDataType = {
  SoundAlbum: SoundAlbumType | null;
  SoundItemList: Array<SoundItemType>;
  defaultPlaylist: PlaylistType | null;
  isSet: boolean;
  SetSoundAlbum: (album: SoundAlbumType) => void;
  SetDefaultPlaylist: (playlist: PlaylistType) => void;
};

export const useSoundState = create<SoundDataType>((set) => ({
  SoundAlbum: null,
  SoundItemList: [],
  defaultPlaylist: null,
  isSet: false,
  SetSoundAlbum: (data) => {
    set(() => ({
      SoundAlbum: data,
      SoundItemList: parseSoundItems(data),
      isSet: true,
    }));
  },
  SetDefaultPlaylist: (playlist) => {
    set(() => ({
      defaultPlaylist: playlist,
    }));
  },
}));

export default function SoundState({ url = defaultUrl }: { url?: string }) {
  const { RegistPlaylist } = useSoundPlayer();
  const { SetSoundAlbum, SetDefaultPlaylist } = useSoundState();
  const isSet = useRef(false);
  useEffect(() => {
    if (!isSet.current)
      axios(url).then((r) => {
        const album = r.data as SoundAlbumType;
        SetSoundAlbum(album);
        const setupPlaylist = album.playlist?.find((playlist) =>
          playlist.list.some((item) => item.setup)
        ) || { list: [] };
        const setupSoundIndex = setupPlaylist?.list.findIndex(
          (item) => item.setup
        );
        if (setupPlaylist?.list.length > 0) {
          SetDefaultPlaylist(setupPlaylist);
          RegistPlaylist({ playlist: setupPlaylist, current: setupSoundIndex });
        }
      });
    isSet.current = true;
  });

  return <></>;
}
