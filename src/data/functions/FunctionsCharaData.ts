import { readFileSync } from "fs";
import { exportJsonOut } from "../../mediaScripts/MediaUpdateModules";
import { parse } from "jsonc-parser";
const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;
const charaConfigName = "config.characters";

function setCharaId(charaObject: CharaObjectType) {
  Object.entries(charaObject).forEach(([key, chara]) => {
    if (chara) chara.id = key;
  });
}

export function readCharaObject(setId = true) {
  try {
    const rawData: any = parse(readFileSync(`${cwd}/_data/${charaConfigName}.json`, "utf8"));
    if (rawData) {
      const CharaObject: CharaObjectType = rawData;
      if (setId) setCharaId(CharaObject);
      return CharaObject;
    } else return null;
  } catch {
    return null;
  }
}

export function writeCharaObject(charaObject: CharaObjectType) {
  return exportJsonOut(charaConfigName, charaObject, { dir: "_data", space: 2 });
}
