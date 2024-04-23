// @ts-check

import { readFileSync } from "fs";
import { exportJsonOut } from "../../mediaScripts/MediaUpdateModules.mjs";
import { parse } from "jsonc-parser";
const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;
const charaConfigName = "config.characters";

/** @param {CharaObjectType} charaObject  */
function setCharaId(charaObject) {
  Object.entries(charaObject).forEach(([key, chara]) => {
    chara.id = key;
  });
}

export function readCharaObject(setId = true) {
  try {
    /** @type {any} */
    const rawData = parse(readFileSync(`${cwd}/_data/${charaConfigName}.json`, "utf8"));
    if (rawData) {
      /** @type {CharaObjectType} */
      const CharaObject = rawData;
      if (setId) setCharaId(CharaObject);
      return CharaObject;
    } else return null;
  } catch {
    return null;
  }
}

/** @param {CharaObjectType} charaObject  */
export function writeCharaObject(charaObject) {
  return exportJsonOut(charaConfigName, charaObject, { dir: "_data", space: 2 });
}
