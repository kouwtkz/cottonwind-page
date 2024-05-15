import { getSetupPlaylist, getSetupSoundIndex, parseSoundItems } from "../functions/sound";
import data from "../../../public/json/sound.json"

export const serverSoundAlbum: SoundAlbumType = data as any;
export const serverSoundItemList = parseSoundItems(serverSoundAlbum);
export const serverDefaultPlaylist = getSetupPlaylist(serverSoundAlbum);
export const serverDefaultSoundIndex = getSetupSoundIndex(serverDefaultPlaylist);
