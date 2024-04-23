// @ts-check

import fs from "fs";
import sharp from "sharp";
import { resolve, dirname, parse } from "path";
const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;

/**
 * @typedef {"contain" | "cover" | "fill" | "outside" | "inside"} FitMethod
 */

/**
 * @param {retouchImageHandleProps} args
 */
export async function retouchImageFromYamls({ yamls, deleteImage = false, publicDir = 'public', selfRoot = false }) {
  /** @type {string[]} */
  const outputPublicImages = [];
  const publicFullDir = resolve((selfRoot ? "." : cwd) + "/" + publicDir);
  const toList = Array.from(new Set(yamls.map(({ to }) => to)));
  /** @type {{ isFile: boolean, path: string }[]} */
  let currentPublicItems = [];
  toList.forEach(to => {
    const path = resolve(`${publicFullDir}/${to}`);
    try { fs.mkdirSync(path, { recursive: true }) } catch { }
    currentPublicItems = currentPublicItems.concat(
      fs.readdirSync(path, { recursive: true, withFileTypes: true })
        .map(dirent => ({ isFile: dirent.isFile(), path: resolve(`${dirent.path}/${dirent.name}`) }))
    )
  })
  for (const y of yamls) {
    for (const image of y.list) {
      image.fullPath = image.fullPath ?? resolve(`${cwd}/${y.from}/${y.dir}/${image.dir || ""}/${image.src}`);
      try {
        image.mtime = new Date(fs.statSync(image.fullPath).mtime);
      } catch (e) {
        console.error(`[${image.fullPath}]のパスのファイルを取得できませんでした。`);
        image.fullPath = undefined;
      }
      const baseImageFullPath = image.fullPath;
      if (baseImageFullPath) {
        const imageBaseDir = `${y.dir}/${image.dir || ""}`.replace(/\/+/g, '/');
        const imageDir = `/${y.to}/${imageBaseDir}/`.replace(/\/+/g, '/');
        image.fullPath = resolve(`${cwd}/${y.from}/${imageBaseDir}/${image.src}`);
        const imageFullPath = resolve(`${publicFullDir}/${image.URL ?? (imageDir + image.src)}`);
        outputPublicImages.push(imageFullPath);
        let copy = true;
        const mtimeBase = image.mtime;
        if (mtimeBase && currentPublicItems.some(({ path }) => path === imageFullPath)) {
          const mtimeCurrent = new Date(fs.statSync(imageFullPath).mtime);
          copy = mtimeBase > mtimeCurrent;
        }
        if (copy) {
          try {
            fs.mkdirSync(dirname(imageFullPath), { recursive: true });
          } catch { } finally {
            if (baseImageFullPath) {
              const toWebp = !/\.(svg|gif)$/i.test(image.src);
              if (toWebp) await sharp(baseImageFullPath).webp().toFile(imageFullPath);
              else {
                try { fs.copyFileSync(baseImageFullPath, imageFullPath) } catch { }
              }
            }
          }
        }
        image.resizeOptions?.forEach(async (resizeOption) => {
          if (!resizeOption.url) return;
          const resizedImageFullPath = resolve(`${publicFullDir}/${resizeOption.url}`);
          let make = true;
          if (mtimeBase && currentPublicItems.some(({ path }) => path === resizedImageFullPath)) {
            const mtimeCurrent = new Date(fs.statSync(resizedImageFullPath).mtime);
            make = mtimeBase > mtimeCurrent;
          }
          if (make) {
            await RetouchImage({ ...{ src: baseImageFullPath, output: resizedImageFullPath }, ...resizeOption });
          }
          outputPublicImages.push(resizedImageFullPath);
        })
      }
    }
    y.list.forEach((image) => {
      delete image.mtime;
      delete image.fullPath;
    });
  }

  if (deleteImage) {
    const currentPublicImages = currentPublicItems.filter(item => item.isFile).map(({ path }) => path);
    const deletePublicImages = currentPublicImages.filter(path => !outputPublicImages.some(_path => _path === path))
    deletePublicImages.forEach(path => { try { fs.unlinkSync(resolve(path)) } catch { } })
  }
}

/**
 * @param {{ src: string; output: string; size?: number | { h: number, w: number } | null; quality?: number; fit?: FitMethod; }} param0 
 * @returns 
 */
export async function RetouchImage({ src, output, size = null, quality, fit = "cover" }) {
  if ((() => {
    try {
      const toTime = fs.statSync(output).mtime;
      const fromTime = fs.statSync(src).mtime;
      return fromTime <= toTime;
    } catch {
      return false;
    }
  })()) return null

  const outputPath = parse(output);
  const targetImage = sharp(src);
  const metadata = await targetImage.metadata();

  const { w, h } = typeof (size) === "number" ? { w: size, h: size } : (size !== null ? size : { w: null, h: null });
  if (w && h && (!(metadata.width && metadata.height) || ((w * h) < (metadata.width * metadata.height)))) {
    targetImage.resize(w, h, { fit: fit })
  }

  switch (outputPath.ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      targetImage.jpeg(
        { quality }
      )
      break;
    case ".png":
      targetImage.png(
        { compressionLevel: quality }
      )
      break;
    case ".webp":
      targetImage.webp(
        { quality }
      )
      break;
  }

  fs.mkdir(outputPath.dir, { recursive: true }, () => {
    targetImage.toFile(output);
  })
}
