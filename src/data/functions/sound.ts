import { PlaylistType, SoundAlbumType, SoundItemType } from "../../types/MediaSoundType";

export function parseSoundItems(soundAlbum: SoundAlbumType) {
  const soundList: SoundItemType[] = [];
  soundAlbum.playlist?.forEach((playlist) => {
    playlist.list.forEach((item) => {
      soundList.push(item);
    });
  });
  return soundList;
}

export function getSetupPlaylist(soundAlbum: SoundAlbumType) {
  return soundAlbum.playlist?.find((playlist) =>
    playlist.list.some((item) => item.setup)
  ) || { list: [] }
}

export function getSetupSoundIndex(playlist: PlaylistType) {
  return playlist?.list.findIndex(
    (item) => item.setup
  )
}