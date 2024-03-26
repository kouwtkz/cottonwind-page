// @ts-check

/** @typedef { import("../../types/CharaType.d").CharaType } CharaType */
/** @typedef { import("../../types/CharaType.d").CharaObjectType } CharaObjectType */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { load, dump } from "js-yaml";
const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;
const charaYamlPath = resolve(`${cwd}/_data/characters.yaml`)

/** @param {CharaObjectType} charaObject  */
function setCharaId(charaObject) {
  Object.entries(charaObject).forEach(([key, chara]) => {
    chara.id = key;
  });
}

export function getCharaObjectFromYaml(setId = true) {
  try {
    /** @type {any} */
    const rawData = load(readFileSync(charaYamlPath, "utf8"));
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
export function setCharaObjectToYaml(charaObject) {
  return writeFileSync(charaYamlPath, dump(charaObject));
}
