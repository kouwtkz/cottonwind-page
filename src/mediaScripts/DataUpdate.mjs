// @ts-check

import { dataImportDir, exportJsonOut, exportTsOut } from "./MediaUpdateModules.mjs";
import CopyDirDiff from "./CopyDirDiff.mjs";
import { GetMediaImageAlbums } from "./GetImageList.mjs";
import { ReadImageFromYamls } from "./ReadImage.mjs";
import { UpdateImageYaml } from "./UpdateImage.mjs";
import { fromto } from "./UpdateOption.mjs";
import { retouchImageFromYamls } from "./RetouchImage.mjs";
import { getSoundAlbum } from "../data/functions/FunctionsSoundData.mjs";
import { readCharaObject } from "../data/functions/FunctionsCharaData.mjs";

const mode = process.argv[2] ?? null;
/** @type string[] */
const doneList = [];

// キャラクターデータのコピー
if (!mode || mode === "character") {
  const characterData = readCharaObject();
  exportJsonOut("characters", characterData);
  doneList.push("キャラクター");
}

// 画像データのコピー
if (!mode || mode === "image") {
  const albumData = await GetMediaImageAlbums({ ...fromto, readSize: true, filter: { archive: false }, readImageHandle: ReadImageFromYamls });
  exportJsonOut("images", albumData);
  await UpdateImageYaml({ ...fromto, retouchImageHandle: retouchImageFromYamls });
  doneList.push("画像");
}

// 埋め込みや電子書籍ファイルのコピー
if (!mode || mode === "embed") {
  CopyDirDiff("_data/embed", "public/static", { identical: true });
  doneList.push("埋め込み");
}

// 音楽ファイルのコピー
if (!mode || mode === "sound") {
  CopyDirDiff("_data/sound", "public/static", { identical: true, ignore: "_data.yaml" });
  exportJsonOut("sound", getSoundAlbum());
  doneList.push("サウンド");
}

console.log({ message: "データの更新しました", "更新内容": doneList });
