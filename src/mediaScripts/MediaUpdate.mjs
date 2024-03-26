// @ts-check

import { exportJsonOut, exportTsOut } from "./MediaUpdateModules.mjs";
import CopyDirDiff from "./CopyDirDiff.mjs";
import { GetMediaImageAlbums } from "./GetImageList.mjs";
import { ReadImageFromYamls } from "./ReadImage.mjs";
import { UpdateImageYaml } from "./UpdateImage.mjs";
import { fromto } from "./UpdateOption.mjs";
import { retouchImageFromYamls } from "./RetouchImage.mjs";
import { getSoundAlbum } from "../data/functions/FunctionsSoundData.mjs";
import { getCharaObjectFromYaml } from "../data/functions/FunctionsCharaData.mjs";
import { getSiteData } from "../data/functions/FunctionsSiteData.mjs";

// 画像データのコピー
const albumData = await GetMediaImageAlbums({ ...fromto, readSize: true, filter: { archive: false }, readImageHandle: ReadImageFromYamls });
exportJsonOut("images", albumData);
await UpdateImageYaml({ ...fromto, retouchImageHandle: retouchImageFromYamls });

// 埋め込みや電子書籍ファイルのコピー
CopyDirDiff("_data/embed", "public/static", { identical: true });

// 音楽ファイルのコピー
CopyDirDiff("_data/sound", "public/static", { identical: true, ignore: "_data.yaml" });
exportJsonOut("sound", getSoundAlbum());

exportJsonOut("characters", getCharaObjectFromYaml());

exportTsOut("site", getSiteData());

console.log("メディアの更新しました");