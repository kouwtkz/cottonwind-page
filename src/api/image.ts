import { Hono } from "hono";
import { optimizeImage } from "wasm-image-optimization";
import { getExtension, getName } from "@/functions/doc/PathParse";
import { imageDimensionsFromStream } from "image-dimensions";
import { MeeSqlD1 } from "@/functions/MeeSqlD1";
import { IsLogin } from "@/admin";
import {
  KeyValueConvertDBEntry,
  lastModToUniqueNow,
} from "@/functions/doc/ToFunction";
import { JoinUnique } from "@/functions/doc/StrFunctions";
import { DBTableClass } from "./DBTableClass";

export const app = new Hono<MeeBindings<MeeAPIEnv>>({
  strict: false,
});

app.use("*", async (c, next) => {
  if (IsLogin(c)) return next();
  else return c.text("403 Forbidden", 403);
});

const TableObject = new DBTableClass<ImageDataType>({
  table: "images",
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT", unique: true, notNull: true },
    name: { type: "TEXT" },
    album: { type: "TEXT" },
    description: { type: "TEXT" },
    src: { type: "TEXT" },
    webp: { type: "TEXT" },
    thumbnail: { type: "TEXT" },
    icon: { type: "TEXT" },
    width: { type: "INTEGER" },
    height: { type: "INTEGER" },
    tags: { type: "TEXT" },
    characters: { type: "TEXT" },
    copyright: { type: "TEXT" },
    link: { type: "TEXT" },
    embed: { type: "TEXT" },
    type: { type: "TEXT" },
    topImage: { type: "INTEGER" },
    pickup: { type: "INTEGER" },
    draft: { type: "INTEGER" },
    time: { type: "TEXT", index: true },
    mtime: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
    version: { type: "INTEGER" },
  },
});

export async function ServerImagesGetData(
  searchParams: URLSearchParams,
  db: MeeSqlD1,
  isLogin?: boolean
) {
  const wheres: MeeSqlFindWhereType<ImageDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  const src = searchParams.get("src");
  if (src) wheres.push({ src });
  async function Select() {
    return TableObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map(v => (v.draft || !v.version) ? { ...v, ...TableObject.getFillNullEntry, key: null } : v));
  }
  return Select().catch(() => TableObject.CreateTable({ db }).then(() => Select()));
}

app.patch("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const rawData = await c.req.json();
  const data = Array.isArray(rawData) ? rawData : [rawData];
  const now = new Date();
  return Promise.all(
    data.map(async item => {
      let {
        id,
        rename,
        ...values
      } = item as imageUpdateJsonDataType;
      const entry: MeeSqlEntryType<ImageDataType> = {
        ...values,
        lastmod: now.toISOString(),
      };
      KeyValueConvertDBEntry(entry);
      if (rename) {
        const value = (await TableObject.Select({ db, where: { id } }))[0];
        if (value) {
          entry.key = rename;
          async function renamePut(
            key: "src" | "webp" | "thumbnail" | "icon",
            rename: string
          ) {
            if (value[key]) {
              const object = await c.env.BUCKET.get(value[key]);
              if (object) {
                entry[key] = rename;
                await c.env.BUCKET.put(rename, await object.arrayBuffer());
                await c.env.BUCKET.delete(value[key]);
              }
            }
          }
          const renameSrc = value.src
            ? rename + "." + getExtension(value.src)
            : null;
          const renameWebp = rename + ".webp";
          if (renameSrc) await renamePut("src", "image/" + renameSrc);
          await renamePut("webp", "image/webp/" + renameWebp);
          await renamePut("thumbnail", "image/thumbnail/" + renameWebp);
          await renamePut("icon", "image/icon/" + renameWebp);
        }
      }
      await TableObject.Update({ db, entry, where: { id } });
      now.setMilliseconds(now.getMilliseconds() + 1);
    })
  ).then((results) => c.json(results));
});

app.delete("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const data = await c.req.json();
  if (typeof data.id === "number") {
    const values = (await TableObject.Select({ db, params: "*", where: { id: data.id } }))[0];
    if (values.src) c.env.BUCKET.delete(values.src);
    if (values.webp) c.env.BUCKET.delete(values.webp);
    if (values.thumbnail) c.env.BUCKET.delete(values.thumbnail);
    if (values.icon) c.env.BUCKET.delete(values.icon);
    const nullEntry = TableObject.getFillNullEntry;
    await TableObject.Update({ db, entry: { ...nullEntry, lastmod: new Date().toISOString() }, where: { id: data.id } });
    return c.text(values.src + "を削除しました");
  }
  return c.text("削除するデータがありません");
});

async function Resize({
  image,
  size,
  quality,
  format,
  metaSize,
}: {
  image: BufferSource;
  size: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp";
  metaSize?: { width: number; height: number };
}) {
  const resizable = metaSize
    ? metaSize.height * metaSize.width > size * size
    : true;
  if (resizable) {
    const width = metaSize
      ? metaSize.width > metaSize.height
        ? undefined
        : size
      : size;
    const height = metaSize
      ? metaSize.height > metaSize.width
        ? undefined
        : size
      : size;
    if (width || height) {
      return await optimizeImage({
        format,
        image,
        width,
        height,
        quality,
      });
    }
  }
  return null;
}

app.post("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const formData = await c.req.formData();
  const attached = formData.get("attached") as File | null;
  const mtime = formData.get("mtime") as string | null;
  const album = formData.get("album") as string | null;
  const albumOverwrite = (formData.get("albumOverwrite") || "true") === "true";
  const tags = formData.get("tags") as string | null;
  const characters = formData.get("characters") as string | null;
  const images: {
    [k in imageModeType]?: { path: string; buf?: Uint8Array | ArrayBuffer | null };
  } = {};
  const webp = formData.get("webp") as File | null;
  const thumbnail = formData.get("thumbnail") as File | null;
  const icon = formData.get("icon") as File | null;
  const filename = attached?.name || (icon || webp || thumbnail)?.name;
  const name = filename ? getName(filename) : "";
  const id = formData.has("id") ? Number(formData.get("id")) : null;
  const width = formData.has("width") ? Number(formData.get("width")) : null;
  const height = formData.has("height") ? Number(formData.get("height")) : null;
  let metaSize: { width: number; height: number } | undefined;
  if (width && height) metaSize = { width, height };
  async function fileModeUpload(mode: imageModeType, file?: File | null) {
    if (file) {
      const path = "image/" + (mode === "src" ? "" : mode + "/") + file.name;
      images[mode] = {
        path,
        buf: await file.arrayBuffer(),
      };
    }
  }
  await fileModeUpload("webp", webp);
  await fileModeUpload("thumbnail", thumbnail);
  await fileModeUpload("icon", icon);
  const alreadyOptimize = Boolean(icon || webp || thumbnail);
  let imageBuffer: ArrayBuffer | undefined;
  function Select() {
    const where: MeeSqlFindWhereType<ImageDataType> =
      id === null ? { key: name } : { id };
    return TableObject.Select({ db, where });
  }
  const selectValue = await Select().catch(() =>
    TableObject.CreateTable({ db }).then(() => Select())
  );
  const timeNum = Number(mtime);
  const time = mtime ? new Date(isNaN(timeNum) ? mtime : timeNum) : new Date();
  const timeString = time.toISOString();
  const value = selectValue[0];
  if (attached) {
    imageBuffer = await attached.arrayBuffer();
    const imagePath = "image/" + attached.name;
    images.src = { path: imagePath };
    const arr = new Uint8Array(imageBuffer);
    const blob = new Blob([arr]);
    const ext = getExtension(attached.name);
    if (!metaSize) metaSize = await imageDimensionsFromStream(blob.stream());
    switch (ext) {
      case "svg":
        break;
      default:
        const webpName = name + ".webp";
        if (!images.webp && !alreadyOptimize) {
          images.webp = { path: "image/webp/" + webpName };
        }
        if (!images.webp && !alreadyOptimize) {
          images.webp = { path: "image/thumbnail/" + webpName };
        }
        break;
    }
    if (value?.mtime !== timeString) {
      if (images.src && imageBuffer) images.src.buf = imageBuffer;
      if (imageBuffer && images.webp && !images.webp.buf) {
        images.webp.buf = await optimizeImage({
          format: "webp",
          image: imageBuffer,
        });
      }
      if (imageBuffer && images.thumbnail && !images.thumbnail.buf) {
        images.thumbnail.buf = await Resize({
          image: imageBuffer,
          format: "webp",
          metaSize,
          quality: 80,
          size: c.env.THUMBNAIL_SIZE ?? 320,
        });
      }
    } else if (images.src) {
      delete images.webp;
      delete images.thumbnail;
      delete images.icon;
    }
  }
  if (images.src?.buf) await c.env.BUCKET.put(images.src.path, images.src.buf);
  if (images.webp?.buf)
    await c.env.BUCKET.put(images.webp.path, images.webp.buf);
  if (images.thumbnail?.buf)
    await c.env.BUCKET.put(images.thumbnail.path, images.thumbnail.buf);
  if (images.icon?.buf)
    await c.env.BUCKET.put(images.icon.path, images.icon.buf);
  const pathes = Object.fromEntries(
    Object.entries(images).map(([k, v]) => [k, v.path || undefined])
  );
  if (selectValue.length > 0) {
    const value = selectValue[0];
    if (images.src?.path && value.src && (images.src.path !== value.src)) {
      await c.env.BUCKET.delete(value.src);
    }
    const updateTags = JoinUnique(value.tags, tags);
    const updateCharacters = JoinUnique(value.characters, characters);
    const entry: MeeSqlEntryType<ImageDataType> = {
      name,
      album: album && (albumOverwrite || !value.album) ? album : (value.album ? undefined : "uploads"),
      ...pathes,
      ...metaSize,
      tags: updateTags,
      characters: updateCharacters,
      time: value.time ? undefined : timeString,
      mtime: timeString,
      lastmod: new Date().toISOString(),
      version: (value.version ?? 0) + 1,
    };
    await TableObject.Update({ db, where: { key: name }, entry });
    return c.json({ ...value, ...entry });
  } else {
    const entry: MeeSqlEntryType<ImageDataType> = {
      name,
      album: album || "art",
      time: timeString,
      mtime: timeString,
      key: name,
      src: images.src?.path,
      draft: 1,
      ...pathes,
      ...metaSize,
      tags,
      characters,
      version: 1,
    };
    await TableObject.Insert({ db, entry });
    return c.json(entry);
  }
});

app.post("/import", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const object = await c.req.json() as importEntryDataType<KeyValueType<unknown>>;
  if (object.data) {
    if (object.overwrite) {
      if (object.deleteBucket) {
        const deleteList = (await c.env.BUCKET.list()).objects.map(
          (object) => object.key
        );
        await c.env.BUCKET.delete(deleteList);
      }
      await TableObject.Drop({ db });
      await TableObject.CreateTable({ db });
    }
    const list = object.data;
    if (Array.isArray(list)) {
      lastModToUniqueNow(list);
      KeyValueConvertDBEntry(list);
      await Promise.all(
        list.map((item) => TableObject.Insert({ db, entry: item }))
      );
      return c.text("インポートしました！");
    }
  }
  return c.text("インポートに失敗しました", 500);
});

app.delete("/", async (c, next) => {
  if (c.env.DEV) {
    const Url = new URL(c.req.url);
    const filename = Url.searchParams.get("path");
    if (filename) {
      await c.env.BUCKET.delete("image/" + filename);
    }
    return c.text("successed!");
  }
  return next();
});
app.delete("/all", async (c, next) => {
  if (c.env.DEV) {
    const list = (await c.env.BUCKET.list()).objects.map(
      (object) => object.key
    );
    await c.env.BUCKET.delete(list);
    const db = new MeeSqlD1(c.env.DB);
    await TableObject.Drop({ db });
    return c.json({ message: "successed!", list });
  }
  return next();
});

export const app_image_api = app;
