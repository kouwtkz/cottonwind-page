// @ts-check

import { imageMeta } from "image-meta";
import fs from "fs";
const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;

/**
 * @typedef { import("../types/MediaImageYamlType.d.ts").readImageHandleProps } readImageHandleProps
 * /
/**
 * @param {readImageHandleProps} args
 */
export async function ReadImageFromYamls({ yamls, readSize = true, resizedDir = 'resized', retouchImageHandle, deleteImage }) {
  for (const y of yamls) {
    // 画像URLの定義
    for (const image of y.list) {
      const imageDir = `/${y.to}/${y.dir}/${image.dir || ""}/`.replace(/\/+/g, '/');
      const toWebp = !/\.(svg|gif)$/i.test(image.src);
      const copyImageSrc = toWebp ? image.src.replace(/[^.]+$/, "webp") : image.src;
      image.URL = `${imageDir}${copyImageSrc}`;
      image.resizeOption = image.resizeOption ? (Array.isArray(image.resizeOption) ? image.resizeOption : [image.resizeOption]) : [];
      if (/^thumbnail/i.test(image.src) && !image.resizeOption.some(({ mode }) => mode === "thumbnail")) {
        image.resizeOption.push({ mode: "thumbnail" });
      }
    }
    // リサイズまわり
    const yResizeOptions = y.data.resizeOption ? (Array.isArray(y.data.resizeOption) ? y.data.resizeOption : [y.data.resizeOption]) : [];
    for (const image of y.list) {
      // svgファイル以外はリサイズ対象にする
      if (!/\.(svg)$/i.test(image.src)) {
        image.resizeOptions = yResizeOptions
          .concat(image.resizeOption ? (Array.isArray(image.resizeOption) ? image.resizeOption : [image.resizeOption]) : [])
          .map(r => ({ ...r }));
        image.resized = [];
        const resized = image.resized;
        image.resizeOptions.forEach(async resizeOption => {
          if (!resizeOption.mode) resizeOption.mode = "thumbnail";
          switch (resizeOption.mode) {
            case "icon":
              if (!resizeOption.size) resizeOption.size = 48;
              if (!resizeOption.ext) resizeOption.ext = "webp"
              break;
            case "thumbnail":
              if (!resizeOption.size) resizeOption.size = 340;
              if (!resizeOption.quality) resizeOption.quality = 80;
              if (!resizeOption.ext) resizeOption.ext = "webp"
              break;
          }
          const resizedImageDir = `/${y.to}/${resizedDir}/${resizeOption.mode}/${y.dir}/${image.dir || ""}/`.replace(/\/+/g, '/');
          const resizedImageUrl = `${resizedImageDir}${image.src.replace(/[^.]+$/, "webp")}`;
          resizeOption.url = resizedImageUrl;
          resized.push({ mode: resizeOption.mode, src: resizedImageUrl })
        })
      }
    }
    for (const image of y.list) {
      if (image.origin) {
        if (readSize) {
          try {
            const b = fs.readFileSync(`${cwd}/${y.from}/${y.dir}/${image.dir || ""}/${image.src}`)
            const size = imageMeta(new Uint8Array(b));
            if (size.width && size.height) image.size = { w: size.width, h: size.height }
          } catch { }
        }
        delete image.fullPath;
      }
    }
  }
  if (retouchImageHandle) await retouchImageHandle({ yamls, deleteImage });
  yamls.forEach(y => y.list.forEach(image => {
    delete image.resizeOption;
    delete image.resizeOptions;
  }))
}
