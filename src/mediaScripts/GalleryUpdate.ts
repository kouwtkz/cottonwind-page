import { fromto } from "./UpdateOption.mjs";
import { GetYamlImageList } from "./GetImageList.mjs"
import { mkdirSync, renameSync, unlinkSync, writeFileSync, utimesSync } from "fs";
import { resolve as pathResolve } from "path";
import { UpdateImageYaml } from "./UpdateImage.mjs";
import { MediaUpdate } from "./MediaUpdateProcess.mjs";
const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;

export async function GalleryPatch(data: any) {
  const { albumDir, src, origin, dir, time, deleteMode, move, rename, ...image } = data;
  const group = [albumDir];
  if (move) group.push(move);
  const yamls = await GetYamlImageList({ ...fromto, filter: { group, endsWith: true } });
  const imageTime = time ? new Date(time) : null;
  const editYaml = yamls.find(album => album.dir === albumDir);
  if (editYaml) {
    if (deleteMode) {
      const uploadImagesFullDir = pathResolve(`${cwd}/${editYaml.from}/${origin}`);
      try { unlinkSync(uploadImagesFullDir) } catch { }
      editYaml.list = editYaml.list.filter(item => item.origin !== origin);
      editYaml.data.list = editYaml.data.list?.filter(item => item.origin !== origin);
    } else {
      const imageItem = editYaml.list.find(item => item.origin === origin)
      if (imageItem) {
        if (imageTime && (imageTime.getTime() !== imageItem.time?.getTime())) {
          imageItem.time = imageTime;
        }
        Object.entries(image).forEach(([k, v]) => {
          imageItem[k] = v;
        });
        if (imageItem.topImage === null) delete imageItem.topImage;
        if (imageItem.pickup === null) delete imageItem.pickup;
        if (move || rename) {
          const imageFullpath = pathResolve(`${cwd}/${editYaml.from}/${origin}`);
          const moveYaml = (move ? yamls.find(album => album.dir === move) : null) || editYaml;
          if (move && editYaml.data.auto && !moveYaml.data.auto) imageItem.dir = "";
          const moveDir = `${cwd}/${moveYaml.from}/${moveYaml.dir}/${imageItem.dir}`;
          if (move) try { mkdirSync(pathResolve(moveDir)) } catch { }
          if (rename) imageItem.src = rename;
          const moveImageFullpath = pathResolve(`${moveDir}/${imageItem.src}`);
          renameSync(imageFullpath, moveImageFullpath);
          editYaml.list = editYaml.list.filter(({ src }) => imageItem.src !== src)
          moveYaml.list.push(imageItem);
        }
      }
    }
  }
  await UpdateImageYaml({ yamls, deleteImage: false, ...fromto })
  MediaUpdate();
}

type Props = {
  attached: File[];
  attached_mtime?: any[];
  tags?: any[];
  uploadDir: string;
}
export async function uploadAttached({ attached, attached_mtime = [], tags = [], uploadDir }: Props) {
  let retVal = false
  attached = attached.filter(file => Boolean(file.name));
  if (attached.length > 0) {
    retVal = true;
    const now = new Date();
    const dataDir = process.env.DATA_DIR || "";
    const publicDir = "public";
    const uploadImageDir = `${fromto.from}/${uploadDir}`;
    const uploadImagesFullDir = pathResolve(`${cwd}/${dataDir}/${uploadImageDir}`);
    const uploadPublicImagesFullDir = pathResolve(`${cwd}/${publicDir}/${uploadImageDir}`);
    try { mkdirSync(uploadImagesFullDir, { recursive: true }); } catch { }
    try { mkdirSync(uploadPublicImagesFullDir, { recursive: true }); } catch { }
    attached.forEach(async (file, i) => {
      await file.arrayBuffer().then((abuf) => {
        const mTime = new Date(Number(attached_mtime[i]));
        const filename = file.name.replaceAll(" ", "_");
        const filePath = pathResolve(`${uploadImagesFullDir}/${filename}`);
        writeFileSync(filePath, Buffer.from(abuf));
        utimesSync(filePath, now, new Date(mTime));
      })
    })
    await new Promise<void>((resolve, reject) => {
      setTimeout(async () => {
        UpdateImageYaml({ ...fromto }).then(async () => {
          const tagsFlag = tags.length > 0;
          if (tagsFlag) {
            const yamls = await GetYamlImageList({ ...fromto, filter: { group: uploadDir, endsWith: true } });
            yamls.forEach(album => {
              attached.forEach(file => {
                const imageItem = album.list.find(item => item.src === file.name)
                if (imageItem) imageItem.tags = Array.from(new Set((imageItem.tags || []).concat(tags)));
              })
            })
            UpdateImageYaml({ yamls, deleteImage: false, ...fromto }).then(() => resolve());
          } else {
            resolve()
          }
        });
      }, 10);
    });
    MediaUpdate();
    return retVal;
  }
  return retVal;
}
