import { dataImportDir, exportJsonOut, exportTsOut } from "./MediaUpdateModules";
import CopyDirDiff from "./CopyDirDiff";
import { GetMediaImageAlbums } from "./GetImageList";
import { ReadImageFromYamls } from "./ReadImage";
import { UpdateImageYaml } from "./UpdateImage";
import { fromto } from "./UpdateOption";
import { retouchImageFromYamls } from "./RetouchImage";
import { getSoundAlbum } from "@/data/functions/FunctionsSoundData";
import { readCharaObject } from "@/data/functions/FunctionsCharaData";

const mode = process.argv[2] ?? null;
const doneList: string[] = [];

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
