// @ts-check

import { readFileSync } from "fs";
import { load } from "js-yaml";
export const yamlPath = `_data/sound/_data.yaml`;
const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;

const outputStaticDir = `/static`;
const outputSoundDir = `/sound`;

// m4aはVS Browserは非対応、いずれmp3に統一する
export function getSoundAlbum() {
  /** @type {any} */
  const rawData = load(String(readFileSync(`${cwd}/${yamlPath}`, "utf8")));
  if (rawData) {
    /** @type {SoundAlbumType} */
    const soundAlbum = rawData;
    soundAlbum.playlist?.forEach(
      sounds => {
        sounds.list.forEach(
          (sound) => { sound.src = `${outputStaticDir}${soundAlbum.dir ?? outputSoundDir}/${sound.src}` })
      })
    return soundAlbum;
  } else return null;
}
