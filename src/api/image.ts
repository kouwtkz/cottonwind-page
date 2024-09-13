import { Hono } from "hono";
import { optimizeImage } from "wasm-image-optimization";
import { getExtension, getName } from "@/functions/doc/PathParse";
import { imageDimensionsFromStream } from "image-dimensions";
import { MeeSqlD1 } from "@/functions/MeeSqlD1";
import { IsLogin } from "@/ServerContent";
import {
  KeyValueToString,
  lastModToUniqueNow,
} from "@/functions/doc/ToFunction";
import { MeeSqlClass } from "@/functions/MeeSqlClass";
import { JoinUnique } from "@/functions/doc/StrFunctions";

export const app = new Hono<MeeBindings<MeeAPIEnv>>({
  strict: false,
});

app.use("*", async (c, next) => {
  if (IsLogin(c)) return next();
  else return c.text("403 Forbidden", 403);
});

const table = "images";

const createEntry: MeeSqlCreateTableEntryType<ImageDataType> = {
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
  time: { type: "TEXT", index: true },
  mtime: { type: "TEXT" },
  lastmod: { createAt: true, unique: true },
  version: { type: "INTEGER" },
};

async function CreateTable(d1: MeeSqlD1) {
  await d1
    .createTable({
      table,
      entry: createEntry,
    })
    .catch(() => { });
}

export async function ServerImagesGetData(
  searchParams: URLSearchParams,
  db: MeeSqlD1
) {
  const wheres: MeeSqlFindWhereType<ImageDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  const src = searchParams.get("src");
  if (src) wheres.push({ src });
  function Select() {
    return db.select<ImageDataType>({ table, where: { AND: wheres } });
  }
  return Select().catch(() => CreateTable(db).then(() => Select()));
}

function FormBoolToInt(v?: string) {
  switch (v) {
    case "true":
      return 1;
    case "false":
      return 0;
    case "null":
    case "undefined":
      return null;
    default:
      return;
  }
}

function BlankStringsToNull(...args: (string | undefined)[]) {
  if (args.some((v) => v !== undefined)) {
    const union = args.filter((v) => v).join(",");
    return union || null;
  } else return undefined;
}

app.patch("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  let {
    id: _id,
    src,
    rename,
    name,
    time,
    mtime,
    charaTags,
    otherTags,
    topImage,
    pickup,
    ...values
  } = (await c.req.parseBody()) as unknown as imageFormDataType;
  const entry: MeeSqlEntryType<ImageDataType> = {
    topImage: FormBoolToInt(topImage),
    pickup: FormBoolToInt(pickup),
    name,
    time: time ? new Date(time).toISOString() : time,
    lastmod: new Date().toISOString(),
    ...Object.entries(values).reduce<KeyValueType<unknown>>((a, [k, v]) => {
      a[k] = BlankStringsToNull(v as string | undefined);
      return a;
    }, {}),
  };
  const id = Number(_id);
  if (rename) {
    const value = (await db.select<ImageDataType>({ table, where: { id } }))[0];
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
  await db.update<ImageDataType>({ table, entry, where: { id } });
  return c.text(src ?? id + "を更新しました");
});

app.delete("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const formdata = await c.req.parseBody();
  if (typeof formdata.id === "string") {
    const id = Number(formdata.id);
    const values = (
      await db.select<ImageDataType>({ table, params: "*", where: { id } })
    )[0];
    if (values.src) c.env.BUCKET.delete(values.src);
    if (values.webp) c.env.BUCKET.delete(values.webp);
    if (values.thumbnail) c.env.BUCKET.delete(values.thumbnail);
    if (values.icon) c.env.BUCKET.delete(values.icon);
    const nullEntry = MeeSqlD1.getNullEntry(createEntry);
    await db.update<ImageDataType>({
      table,
      entry: { ...nullEntry, lastmod: new Date().toISOString() },
      where: { id },
    });
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

async function getRetryTime(e: Error, time: Date, db: MeeSqlD1) {
  if (/UNIQUE.+\.time/.test(e.message)) {
    time.setSeconds(time.getSeconds() + 1);
    const values = await db.select<any>({
      table,
      where: { time: { lt: time.toISOString() } },
      take: 1,
      orderBy: { time: "desc" },
    });
    if (values.length > 0 && values[0].time) {
      const retryTime = new Date(values[0].time);
      retryTime.setMilliseconds(retryTime.getMilliseconds() + 1);
      return retryTime;
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
  let imageBuffer: ArrayBuffer | undefined;
  function Select() {
    const where: MeeSqlFindWhereType<ImageDataType> =
      id === null ? { key: name } : { id };
    return db.select<ImageDataType>({ table, where });
  }
  const selectValue = await Select().catch(() =>
    CreateTable(db).then(() => Select())
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
        if (!images.webp && typeof webp === "undefined") {
          images.webp = { path: "image/webp/" + webpName };
        }
        if (!images.webp && typeof thumbnail === "undefined") {
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
      version: (value.version ?? 0) + 1,
    };
    await db.update<ImageDataType>({
      table,
      where: { key: name },
      entry,
      rawEntry: { lastmod: MeeSqlD1.isoFormat() },
    });
    return c.json({ ...value, ...entry });
  } else {
    const entry: MeeSqlEntryType<ImageDataType> = {
      name,
      album: album || "art",
      time: timeString,
      mtime: timeString,
      key: name,
      src: images.src?.path,
      ...pathes,
      ...metaSize,
      tags,
      characters,
      version: 1,
    };
    await db.insert<ImageDataType>({
      table,
      entry,
    });
    return c.json(entry);
  }
});

app.post("/import", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const formData = await c.req.parseBody();
  if (typeof formData.data === "string") {
    if (c.env.DEV) {
      const deleteList = (await c.env.BUCKET.list()).objects.map(
        (object) => object.key
      );
      await c.env.BUCKET.delete(deleteList);
    }
    await db.dropTable({ table });
    await CreateTable(db);
    const list = JSON.parse(formData.data) as KeyValueType<unknown>[];
    if (Array.isArray(list)) {
      lastModToUniqueNow(list);
      KeyValueToString(list);
      await Promise.all(
        list.map((item) => db.insert({ table, entry: item }))
      );
      return c.text("インポート完了しました！");
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
    await db.dropTable({ table });
    return c.json({ message: "successed!", list });
  }
  return next();
});

export const app_image_api = app;
