import { Hono } from "hono";
import { getBasename, getName } from "@/functions/doc/PathParse";
import { imageDimensionsFromData } from "image-dimensions";
import { MeeSqlD1 } from "@/data/functions/MeeSqlD1";
import { IsLogin } from "@/admin";
import { KeyValueConvertDBEntry } from "@/functions/doc/ToFunction";
import { JoinUnique } from "@/functions/doc/StrFunctions";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { UpdateTablesDataObject } from "./DBTablesObject";
import { ImageDataOptions } from "@/data/DataEnv";
import { GetDataProps } from "./propsDef";
import { ImageBucketRename } from "./serverFunction";

export const app = new Hono<MeeBindings<MeeCommonEnv>>({
  strict: false,
});

app.use("*", async (c, next) => {
  if (IsLogin(c)) return next();
  else return c.text("403 Forbidden", 403);
});

const TableObject = new DBTableClass<ImageDataType>({
  table: ImageDataOptions.name,
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT", unique: true, notNull: true },
    title: { type: "TEXT" },
    album: { type: "TEXT" },
    description: { type: "TEXT" },
    src: { type: "TEXT" },
    thumbnail: { type: "TEXT" },
    width: { type: "INTEGER" },
    height: { type: "INTEGER" },
    tags: { type: "TEXT" },
    characters: { type: "TEXT" },
    copyright: { type: "TEXT" },
    link: { type: "TEXT" },
    embed: { type: "TEXT" },
    type: { type: "TEXT" },
    order: { type: "INTEGER" },
    topImage: { type: "INTEGER" },
    pickup: { type: "INTEGER" },
    position: { type: "TEXT" },
    draft: { type: "INTEGER" },
    time: { type: "TEXT", index: true },
    mtime: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
    version: { type: "INTEGER" },
  },
  insertEntryKeys: ["key", "title", "album", "description", "src", "thumbnail", "width", "height",
    "tags", "characters", "copyright", "link", "embed", "type", "order", "topImage", "pickup", "draft", "version"],
  insertEntryTimes: ["time", "mtime", "lastmod"]
});
export const ImageTableObject = TableObject;

export async function ServerImagesGetData({ searchParams, db, isLogin }: GetDataProps) {
  const wheres: MeeSqlFindWhereType<ImageDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  if (!isLogin) wheres.push({ lastmod: { lte: new Date().toISOString() } });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  const src = searchParams.get("src");
  if (src) wheres.push({ src });
  async function Select() {
    return TableObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map(v => (v.draft || !v.version) ? { ...v, ...TableObject.getFillNullEntry, draft: v.draft } : v));
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: ImageDataOptions }))
    .then(() => Select()));
}

app.patch("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const rawData = await c.req.json();
  const data = Array.isArray(rawData) ? rawData : [rawData];
  const now = new Date();
  return Promise.all(
    data.map(async item => {
      const nowString = now.toISOString();
      now.setMilliseconds(now.getMilliseconds() + 1);
      let {
        id,
        rename,
        ...values
      } = item as imageUpdateJsonDataType;
      const entry: MeeSqlEntryType<ImageDataType> = values;
      const value = (await TableObject.Select({ db, where: { id } }))[0];
      entry.lastmod = await TableObject.getClassifyScheduleValue({
        db,
        now: nowString,
        time: item.time,
        existTime: value.time,
      });
      if (rename) {
        if (value) {
          entry.key = rename;
          await ImageBucketRename({ bucket: c.env.BUCKET, rename, image: value, entry });
        }
      }
      KeyValueConvertDBEntry(entry);
      await TableObject.Update({ db, entry, where: { id } });
    })
  ).then((results) => c.json(results));
});

app.delete("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const data = await c.req.json();
  if (typeof data.id === "number") {
    const values = (await TableObject.Select({ db, params: "*", where: { id: data.id } }))[0];
    if (values.src) c.env.BUCKET.delete(values.src);
    if (values.thumbnail) c.env.BUCKET.delete(values.thumbnail);
    const nullEntry = TableObject.getFillNullEntry;
    await TableObject.Update({ db, entry: { ...nullEntry, lastmod: new Date().toISOString() }, where: { id: data.id } });
    return c.text(values.src + "を削除しました");
  }
  return c.text("削除するデータがありません");
});

app.post("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const thumbnail = formData.get("thumbnail") as File | null;
  const filename = (file || thumbnail)?.name;
  const mtime = formData.get("mtime") as string | null;
  const album = formData.get("album") as string | null;
  const albumOverwrite = (formData.get("albumOverwrite") || "true") === "true";
  const tags = formData.get("tags") as string | null;
  const characters = formData.get("characters") as string | null;
  const images: {
    [k in imageModeType]?: { path: string; buf?: Uint8Array | ArrayBuffer | null };
  } = {};
  const title = filename ? getName(filename) : "";
  const id = formData.has("id") ? Number(formData.get("id")) : null;
  const width = formData.has("width") ? Number(formData.get("width")) : null;
  const height = formData.has("height") ? Number(formData.get("height")) : null;
  const direct = formData.has("direct");
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
  if (typeof file !== "string") await fileModeUpload("src", file);
  else return c.text("fileがオブジェクトではありません", 500)
  if (typeof thumbnail !== "string") await fileModeUpload("thumbnail", thumbnail);
  else return c.text("thumbnailがオブジェクトではありません", 500)
  let imageBuffer: ArrayBuffer | undefined;
  function Select() {
    const where: MeeSqlFindWhereType<ImageDataType> =
      id === null ? { key: title } : { id };
    return TableObject.Select({ db, where });
  }
  const timeNum = Number(mtime);
  const new_mtime = mtime ? new Date(isNaN(timeNum) ? mtime : timeNum) : new Date();
  if (!metaSize && file) {
    imageBuffer = await file.arrayBuffer();
    const arr = new Uint8Array(imageBuffer);
    const meta = imageDimensionsFromData(arr);
    if (meta) metaSize = meta;
  }
  const pathes = Object.fromEntries(
    Object.entries(images).map(([k, v]) => [k, v.path || null])
  );
  const selectValues = await Select().catch(() =>
    TableObject.CreateTable({ db }).then(() => Select())
  );
  const value = selectValues[0] ? selectValues[0] : null;
  if (images.src?.buf) await c.env.BUCKET.put(images.src.path, images.src.buf);
  if (images.thumbnail?.buf) {
    await c.env.BUCKET.put(images.thumbnail.path, images.thumbnail.buf);
  } else if (value?.thumbnail) {
    await c.env.BUCKET.delete(value.thumbnail);
    pathes.thumbnail = null;
  }
  const timeString = new_mtime.toISOString();
  if (value) {
    if (images.src?.path && value.src && (images.src.path !== value.src)) {
      await c.env.BUCKET.delete(value.src);
    }
    const updateTags = JoinUnique(value.tags, tags);
    const updateCharacters = JoinUnique(value.characters, characters);
    const nowString = new Date().toISOString();
    const entry: MeeSqlEntryType<ImageDataType> = {
      album: album && (albumOverwrite || !value.album) ? album : (value.album ? undefined : "uploads"),
      ...pathes,
      ...metaSize,
      tags: updateTags,
      characters: updateCharacters,
      time: value.time ? undefined : timeString,
      mtime: timeString,
      lastmod: value.time && value.time > nowString ? undefined : nowString,
      version: (value.version ?? 0) + 1,
    };
    if (!value.title) entry.title = title;
    await TableObject.Update({ db, where: { key: title }, entry });
    return c.json({ ...value, ...entry });
  } else {
    const entry: MeeSqlEntryType<ImageDataType> = {
      title,
      album: album || "main",
      time: timeString,
      mtime: timeString,
      key: title,
      src: images.src?.path,
      draft: direct ? null : 1,
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
  return DBTableImport({
    db: new MeeSqlD1(c.env.DB),
    object: await c.req.json(),
    TableObject,
    kvConvertEntry: true,
  })
    .then(() => c.text("インポートしました！"))
    .catch(() => c.text("インポートに失敗しました", 500));
});

app.post("/compat/merge", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const object = await c.req.json() as {
    data: (ImageDataType & {
      webp?: string | null;
      icon?: string | null;
    })[]
  };
  const now = new Date();
  await Promise.all(
    object.data.map(async item => {
      const lastmod = now.toISOString();
      now.setMilliseconds(now.getMilliseconds() + 1);
      if (item.webp && item.icon) await c.env.BUCKET.delete(item.icon);
      const oldSrc = item.src;
      const webSrc = item.webp || item.icon || item.src;
      if (webSrc) {
        if (webSrc.startsWith("image/webp/") || webSrc.startsWith("image/icon/")) {
          const newSrc = "image/" + getBasename(webSrc);
          item.src = newSrc;
          const value = await c.env.BUCKET.get(webSrc);
          if (value) {
            const buf = (await value?.arrayBuffer())!;
            if (oldSrc !== newSrc) {
              await c.env.BUCKET.put(newSrc, buf);
              if (oldSrc) await c.env.BUCKET.delete(oldSrc);
            }
            await c.env.BUCKET.delete(webSrc);
          }
          await TableObject.Update({
            db,
            where: { key: item.key },
            entry: { src: newSrc, lastmod },
          })
        }
      }
    }));
  return c.text("");
})

app.delete("/", async (c, next) => {
  if (import.meta.env?.DEV) {
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
  if (import.meta.env?.DEV) {
    const list = (await c.env.BUCKET.list({ prefix: "image" })).objects.map(
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
