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
          (sound) => {
            const soundDir = sound.dir ?? sounds.dir;
            sound.src = `${outputStaticDir}${soundAlbum.dir ?? outputSoundDir}/${soundDir ? (soundDir + '/') : ''}${sound.src}`
          })
      })
    return soundAlbum;
  } else return null;
}
