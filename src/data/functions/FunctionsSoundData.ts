import { readFileSync } from "fs";
import { load } from "js-yaml";
export const yamlPath = `_data/sound/_data.yaml`;
const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;

const outputStaticDir = `/static`;
const outputSoundDir = `/sound`;

// m4aはVS Browserは非対応、いずれmp3に統一する
export function getSoundAlbum() {
  const rawData: any = load(String(readFileSync(`${cwd}/${yamlPath}`, "utf8")));
  if (rawData) {
    const soundAlbum: SoundAlbumType = rawData;
    soundAlbum.playlist?.forEach(
      sounds => {
        sounds.list.forEach(
          (sound) => {
            const soundDir = sound.dir ?? sounds.dir;
            sound.src = `${outputStaticDir}${soundAlbum.dir ?? outputSoundDir}/${soundDir ? (soundDir + '/') : ''}${sound.src}`
          })
      })
    return soundAlbum;
  } else return null;
}
