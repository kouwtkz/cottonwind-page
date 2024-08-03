import { fromto } from "./UpdateOption";
import { GetYamlImageList } from "./GetImageList"
import { mkdirSync, renameSync, unlinkSync, writeFileSync, utimesSync } from "fs";
import { resolve as pathResolve } from "path";
import { UpdateImageYaml } from "./UpdateImage";
import { MediaUpdate } from "./dataUpdate/updateProcess";
import { CommonContext } from "@/types/HonoCustomType";
const cwd = `${process.cwd()}/${process.env.ROOT || ""}`;

export async function GalleryPatch(c: CommonContext) {
  const { albumDir, src, origin, dir, time, deleteMode, move, rename, ...image } = await c.req.json();
  const group = [albumDir];
  if (move) group.push(move);
  const yamls = await GetYamlImageList({ ...fromto, filter: { group, endsWith: true } });
  const imageTime = time ? new Date(time) : null;
  const editYaml = yamls.find(album => album.dir === albumDir);
  if (editYaml) {
    if (deleteMode) {
      const uploadImagesFullDir = pathResolve(`${cwd}/${origin}`);
      console.log(uploadImagesFullDir);
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
        if (!imageItem.type) delete imageItem.type;
        if (move || rename) {
          const imageFullpath = pathResolve(`${cwd}/${origin}`);
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
  await MediaUpdate({ c, targets: "image" });
}

type Props = {
  c: CommonContext;
  attached: File[];
  attached_mtime?: any[];
  tags?: any[];
  uploadDir: string;
}
export async function uploadAttached({ c, attached, attached_mtime = [], tags = [], uploadDir }: Props) {
  let retVal = false
  if (!Array.isArray(attached)) {
    attached = [attached];
    attached_mtime = [attached_mtime];
  }
  const renamedAttached = attached.filter(file => Boolean(file.name))
    .map((file) => ({ name: file.name.replaceAll(" ", "_"), file }));
  if (renamedAttached.length > 0) {
    retVal = true;
    const now = new Date();
    const publicDir = "public";
    const uploadImageDir = `${fromto.from}/${uploadDir}`;
    const uploadImagesFullDir = pathResolve(`${cwd}/${uploadImageDir}`);
    const uploadPublicImagesFullDir = pathResolve(`${cwd}/${publicDir}/${uploadImageDir}`);
    try { mkdirSync(uploadImagesFullDir, { recursive: true }); } catch { }
    try { mkdirSync(uploadPublicImagesFullDir, { recursive: true }); } catch { }
    renamedAttached.forEach(async ({ file, name }, i) => {
      await file.arrayBuffer().then((abuf) => {
        const mTime = new Date(Number(attached_mtime[i]));
        const filePath = pathResolve(`${uploadImagesFullDir}/${name}`);
        writeFileSync(filePath, Buffer.from(abuf));
        utimesSync(filePath, now, new Date(mTime));
      })
    })
    await new Promise<void>((resolve, reject) => {
      setTimeout(async () => {
        UpdateImageYaml({ ...fromto }).then(async () => {
          if (!Array.isArray(tags)) tags = [tags];
          const tagsFlag = tags.length > 0;
          if (tagsFlag) {
            const yamls = await GetYamlImageList({ ...fromto, filter: { group: uploadDir, endsWith: true } });
            yamls.forEach(album => {
              renamedAttached.forEach(({ name }) => {
                const imageItem = album.list.find(item => item.src === name)
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
    await MediaUpdate({ c, targets: "image" });
    return retVal;
  }
  return retVal;
}
