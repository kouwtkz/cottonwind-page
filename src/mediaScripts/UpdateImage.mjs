// @ts-check

import fs from "fs";
import { resolve } from "path";
import { GetYamlImageList } from "./GetImageList.mjs";
import { ReadImageFromYamls } from "./ReadImage.mjs";
import { dump } from 'js-yaml';
const cwd = `${process.cwd()}/${process.env.ROOT || ""}`; 7

/**
 * @typedef { import("../types/MediaImageYamlType.d.ts").UpdateImageYamlProps } UpdateImageYamlProps
 * @typedef { import("../types/MediaImageYamlType.d.ts").MediaImageInYamlType } MediaImageInYamlType
 */

/**
 * @param {UpdateImageYamlProps} param0 
 */
export async function UpdateImageYaml({ yamls: _yamls, retouchImageHandle, readSize = true, deleteImage = true, ...args }) {
  // yamlを管理するメディアディレクトリ
  const baseDir = `${cwd}/${args.from}`;
  const dataDir = import.meta.env?.VITE_DATA_DIR ?? process.env.VITE_DATA_DIR ?? "";
  const yamls = _yamls || await GetYamlImageList(args);
  const mtimeYamlPath = resolve(`${cwd}/${dataDir}/yamldata_mtimes.json`);
  /** @type {{[key: string]: Date}} */
  const mtimeYamlList = (() => {
    let JsonStr = "{}";
    try { JsonStr = String(fs.readFileSync(mtimeYamlPath)); } catch { }
    /** @type {{[key: string]: string}} */
    const _mtimeYamlList = JSON.parse(JsonStr);
    return Object.fromEntries(Object.entries(_mtimeYamlList)
      .map(([key, value]) => { try { return [key, new Date(String(value))] } catch { return [key, null] } })
      .filter((key, value) => value !== null));
  })();

  // yamlが手動で更新されていればyamlの更新の通りに反映させる
  yamls.filter(y => {
    y.mtime = mtimeYamlList[y.dir];
    try {
      if (y.mtime) {
        const stat = fs.statSync(resolve(`${baseDir}/${y.dir}/${y.name}`));
        return (stat.mtime.getTime() - y.mtime.getTime()) > 1500
      } else return false;
    } catch {
      return false;
    }
  }).forEach(y => {
    y.data.list?.forEach(img => {
      /** @type {{ index: number, dir: string } | undefined} */
      let foundListItem;
      yamls.some((y) => {
        if (!y.data.listup) return false;
        const foundIndex = (y.list || []).findIndex(d => (d.src === img.src));
        if (foundIndex >= 0) {
          foundListItem = { index: foundIndex, dir: y.dir };
          return true;
        }
      }, []);
      if (foundListItem) {
        /** @type MediaImageInYamlType | undefined */
        let gotItem;
        if (y.dir === foundListItem.dir) {
          const foundImage = y.list[foundListItem.index];
          if ((img.dir || '') !== foundImage.dir) {
            try {
              fs.renameSync(
                resolve(`${baseDir}/${y.dir}/${foundImage.dir || ""}/${foundImage.src}`),
                resolve(`${baseDir}/${y.dir}/${img.dir || ""}/${img.src}`),
              )
            } catch { }
            foundImage.dir = img.dir;
          }
        } else {
          const foundYaml = yamls.find(y => y.dir === foundListItem?.dir);
          if (foundYaml) {
            const spliceItems = foundYaml.list?.splice(foundListItem.index, 1) || [];
            if (spliceItems.length > 0) gotItem = spliceItems[0];
            if (gotItem) {
              try {
                fs.renameSync(
                  resolve(`${baseDir}/${foundYaml.dir}/${gotItem.dir || ""}/${gotItem.src}`),
                  resolve(`${baseDir}/${y.dir}/${img.dir || ""}/${img.src}`),
                )
              } catch { }
              y.list?.push(gotItem)
            };
          }
        }
        if (gotItem && !gotItem.tags) gotItem.tags = [];
      } else {
        y.data.list?.push({ ...img, tags: [] })
      }
    });
  });

  // yamlのリストアップ処理
  yamls.forEach((y) => {
    if (y.data.listup) {
      if (!y.data.list) y.data.list = [];
      y.list.forEach(img => {
        const foundSelfImg = y.data.list?.find(_img => _img.src === img.src);
        if (foundSelfImg) {
          if (img.dir)
            foundSelfImg.dir = img.dir;
          else
            delete foundSelfImg.dir;
        } else {
          /** @type {{ index: number, dir: string } | undefined} */
          let foundYamlItem;
          yamls.some((y) => {
            const foundIndex = (y.data.list || []).findIndex(_img => (_img.src === img.src) && !y.list.some(item => item.src === _img.src));
            if (foundIndex >= 0) {
              foundYamlItem = { index: foundIndex, dir: y.dir };
              return true;
            }
          }, []);
          if (foundYamlItem) {
            /** @type MediaImageInYamlType | undefined */
            let gotItem;
            if (y.dir !== foundYamlItem.dir) {
              const spliceItems = yamls.find(y => y.dir === foundYamlItem?.dir)?.data.list?.splice(foundYamlItem.index, 1) || [];
              if (spliceItems.length > 0) gotItem = spliceItems[0];
              if (gotItem) y.data.list?.push(gotItem);
            } else {
              if (y.data.list) {
                gotItem = y.data.list[foundYamlItem.index];
              }
            }
            if (gotItem && !gotItem.tags) gotItem.tags = [];
          } else {
            y.data.list?.push({ ...img, tags: [] })
          }
        }
      });
    }
  })

  // リストの重複削除とリスト内処理
  yamls.forEach((y) => {
    /** @type Map<string, MediaImageInYamlType> */
    const map = new Map();
    y.data.list?.forEach(item => { if (!map.has(item.src)) map.set(item.src, item) })
    const values = Array.from(map.values());
    y.data.notfound = y.data.notfound || [];
    const notfound = y.data.notfound;
    if (values.length > 0) {
      if (y.data.listup) {
        // 存在しなかったファイルをnotfoundに入れる
        values.filter(di => !y.list?.some(yi => yi.src === di.src))
          .forEach(item => {
            notfound.push(values.splice(values.findIndex(yi => yi.src === item.src), 1)[0]);
          })
        // 付与処理
        y.data.list?.forEach((img) => {
          if (y.data.copyright !== undefined && img.copyright === undefined) img.copyright = y.data.copyright;
          // オートフォルダリング
          if (y.data.auto) {
            let dir = img.dir || '';
            if (!dir) {
              if (img.time) {
                // 年ごとにフォルダリング
                if (y.data.auto === "year") {
                  dir = "/" + new Date(img.time).toLocaleString("ja", { timeZone: "JST" }).split("/", 1)[0]
                }
              }
              if (dir !== (img.dir || '')) {
                try { fs.mkdirSync(resolve(`${baseDir}/${y.dir}/${dir}`)) } catch { }
                finally {
                  fs.renameSync(
                    resolve(`${baseDir}/${y.dir}/${img.dir || ""}/${img.src}`),
                    resolve(`${baseDir}/${y.dir}/${dir}/${img.src}`)
                  )
                }
                img.dir = dir;
                const found = y.list.find(item => item.src === img.src);
                if (found) found.dir = dir;
              }
            }
          }
        })
      }
      y.data.list = values;
    }
    if (notfound.length === 0) delete y.data.notfound;

    // 余分なデータの削除する
    y.data.list?.forEach((item) => {
      if (Array.isArray(item.resizeOption) && item.resizeOption.length === 0) delete item.resizeOption;
      if (item.dir === "") delete item.dir;
      if (item.description === "") delete item.description;
      if (item.tags?.length === 0 || item.tags === null) delete item.tags;
      else if (item.tags) {
        item.tags = Array.from(new Set(item.tags)); // タグの重複削除
      }
      if (item.title) { item.name = item.title; delete item.title; }
      delete item.origin;
      delete item.originName;
    })
    // ソート
    if (y.data.list) {
      y.data.list.sort((a, b) => a.time && b.time ? (new Date(b.time).getTime()) - (new Date(a.time).getTime()) : 0)
    }
  })

  try {
    fs.writeFileSync(mtimeYamlPath, JSON.stringify(yamls))
  } catch { }

  if (retouchImageHandle) await ReadImageFromYamls({ yamls, deleteImage, retouchImageHandle })
  yamls.forEach(y => y.data.list?.forEach((image) => {
    delete image.URL;
    delete image.resized;
  }))

  yamls.forEach((y) => {
    const outputPath = resolve(`${baseDir}/${y.dir}/${y.name}`);
    try {
      fs.writeFileSync(outputPath, dump(y.data))
    } catch { }
  })
  return yamls;
}
