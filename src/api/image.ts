import { Hono } from "hono";
import { optimizeImage } from "wasm-image-optimization";
import { getExtension, getName } from "@/functions/doc/PathParse";
import { imageDimensionsFromStream } from "image-dimensions";
import { MeeSqlD1 } from "@/functions/MeeSqlD1";
import { IsLogin } from "@/ServerContent";
import { KeyValueToString, lastModToUniqueNow } from "@/functions/doc/ToFunction";
import { MeeSqlClass } from "@/functions/MeeSqlClass";

export const app = new Hono<MeeBindings<MeeAPIEnv>>({
  strict: false,
});

app.use("*", async (c, next) => {
  if (IsLogin(c)) return next();
  else return c.text("403 Forbidden", 403)
});

const table = "images";

const createEntry: MeeSqlCreateTableEntryType<ImageDataType> = {
  id: { primary: true },
  name: { type: "TEXT" },
  album: { type: "TEXT" },
  description: { type: "TEXT" },
  src: { type: "TEXT", unique: true, notNull: true },
  webp: { type: "TEXT", unique: true },
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

export async function ServerImagesGetData(searchParams: URLSearchParams, db: MeeSqlD1) {
  const wheres: MeeSqlFindWhereType<ImageDataType>[] = [];
  const endpoint = searchParams.get("endpoint");
  if (endpoint) wheres.push({ lastmod: { gt: endpoint } });
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
  if (args.some(v => v !== undefined)) {
    const union = args.filter(v => v).join(",");
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
  type typeValues = typeof values;
  const entry: ImageDataType = {
    topImage: FormBoolToInt(topImage),
    pickup: FormBoolToInt(pickup),
    name,
    time: time ? new Date(time).toISOString() : time,
    lastmod: new Date().toISOString(),
    ...Object.entries(values).reduce<typeValues>((a, [k, v]) => {
      a[(k as keyof typeValues)] = BlankStringsToNull(v as string | undefined);
      return a;
    }, {})
  };
  const id = Number(_id);
  if (rename) {
    const value = (await db.select<ImageDataType>({ table, where: { id } }))[0];
    if (value) {
      async function renamePut(key: "src" | "webp" | "thumbnail" | "icon", rename: string) {
        if (value[key]) {
          const object = await c.env.BUCKET.get(value[key])
          if (object) {
            entry[key] = rename;
            await c.env.BUCKET.put(rename, await object.arrayBuffer())
            await c.env.BUCKET.delete(value[key]);
          }
        }
      }
      const renameBase = getName(rename);
      const renameWebp = renameBase + ".webp";
      await renamePut("src", "image/" + rename);
      await renamePut("webp", "image/webp/" + renameWebp);
      await renamePut("thumbnail", "image/thumbnail/" + renameWebp);
      await renamePut("icon", "image/icon/" + renameWebp);
    }
  }
  await db.update<ImageDataType>({ table, entry, where: { id } })
  return c.text(src ?? id + "を更新しました");
});

app.delete("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const formdata = await c.req.parseBody();
  if (typeof formdata.id === "string") {
    const id = Number(formdata.id);
    const values = (await db.select<ImageDataType>({ table, params: "*", where: { id } }))[0];
    if (values.src) c.env.BUCKET.delete(values.src);
    if (values.webp) c.env.BUCKET.delete(values.webp);
    if (values.thumbnail) c.env.BUCKET.delete(values.thumbnail);
    if (values.icon) c.env.BUCKET.delete(values.icon);
    const nullEntry = MeeSqlD1.getNullEntry(createEntry);
    await db.update<ImageDataType>({
      table,
      entry: { ...nullEntry, lastmod: new Date().toISOString() },
      where: { id }
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
    const values = await db.select<any>({ table, where: { time: { lt: time.toISOString() } }, take: 1, orderBy: { time: "desc" } });
    if (values.length > 0 && values[0].time) {
      const retryTime = new Date(values[0].time);
      retryTime.setMilliseconds(retryTime.getMilliseconds() + 1);
      return retryTime;
    }
  }
  return null;
}

type ModeType = "src" | "webp" | "thumbnail" | "icon";
app.post("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const formData = (await c.req.parseBody()) as KeyValueType<unknown>;
  const attached = (formData.attached as File | undefined) || null;
  const mtime = (formData.mtime as string | undefined) || null;
  const album = (formData["album"] as string | undefined);
  const tags = (formData["tags"] as string | undefined) || null;
  const characters = (formData["characters"] as string | undefined) || null;
  const images: { [k in ModeType]?: { path: string, buf?: Uint8Array | ArrayBuffer | null } } = {};
  const webp = typeof formData.webp === "string" ? null : formData.webp as File | undefined;
  const thumbnail = typeof formData.thumbnail === "string" ? null : formData.thumbnail as File | undefined;
  const icon = typeof formData.icon === "string" ? null : formData.icon as File | undefined;
  const filename = attached?.name || webp?.name || thumbnail?.name || icon?.name;
  const name = filename ? getName(filename) : "";
  const id = typeof formData.id === "string" ? Number(formData.id) : null;
  async function fileModeUpload(mode: ModeType, file?: File | null) {
    if (file) {
      const path = "image/" + (mode === "src" ? "" : (mode + "/")) + file.name;
      images[mode] = {
        path,
        buf: await file.arrayBuffer()
      };
    }
  }
  await fileModeUpload("webp", webp);
  await fileModeUpload("thumbnail", thumbnail);
  await fileModeUpload("icon", icon);
  let imageBuffer: ArrayBuffer | undefined;
  if (attached) {
    imageBuffer = await attached.arrayBuffer();
    const imagePath = "image/" + attached.name;
    images.src = { path: imagePath };
    const arr = new Uint8Array(imageBuffer);
    const blob = new Blob([arr]);
    const ext = getExtension(attached.name);
    const metaSize = await imageDimensionsFromStream(blob.stream());
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
    function Select() {
      const where: MeeSqlFindWhereType<ImageDataType> = id === null ? { src: imagePath } : { id };
      return db.select({ table, where })
    }
    const selectValue = await Select().catch(() => CreateTable(db).then(() => Select()));
    const timeNum = Number(mtime);
    const time = mtime ? new Date(isNaN(timeNum) ? mtime : timeNum) : new Date();
    const timeString = time.toISOString();
    const value = selectValue[0];
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
    if (images.src?.buf) await c.env.BUCKET.put(images.src.path, images.src.buf);
    if (images.webp?.buf) await c.env.BUCKET.put(images.webp.path, images.webp.buf);
    if (images.thumbnail?.buf) await c.env.BUCKET.put(images.thumbnail.path, images.thumbnail.buf);
    if (images.icon?.buf) await c.env.BUCKET.put(images.icon.path, images.icon.buf);
    const pathes = Object.fromEntries(Object.entries(images).map(([k, v]) => ([k, v.path || undefined])));
    if (selectValue.length > 0) {
      const updateTags = tags ? (value.tags ? value.tags + "," : "") + tags : undefined;
      const updateCharacters = characters ? (value.characters ? value.characters + "," : "") + characters : undefined;
      await db.update<ImageDataType>({
        table,
        where: { src: imagePath },
        entry: {
          name,
          album: album ? album : (value.album ? undefined : "uploads"),
          ...pathes,
          ...metaSize,
          tags: updateTags,
          characters: updateCharacters,
          time: value.time ? timeString : undefined,
          mtime: timeString,
          version: (value.version ?? 0) + 1
        },
        rawEntry: { lastmod: MeeSqlD1.isoFormat() },
      });
    } else {
      await db.insert<ImageDataType>({
        table,
        entry: {
          name,
          album: album || "art",
          time: timeString,
          mtime: timeString,
          src: imagePath,
          ...pathes,
          ...metaSize,
          tags,
          characters,
          version: 1,
        },
      });
    }
  }
  return c.newResponse(null);
});

app.post("/import", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const formData = await c.req.parseBody();
  if (typeof formData.data === "string") {
    if (formData.version === "0") {
      if (c.env.DEV) {
        const deleteList = (await c.env.BUCKET.list()).objects.map(
          (object) => object.key
        );
        await c.env.BUCKET.delete(deleteList);
        await db.dropTable({ table });
        await CreateTable(db);
      }
      const list = JSON.parse(formData.data) as KeyValueType<unknown>[];
      if (Array.isArray(list)) {
        lastModToUniqueNow(list);
        KeyValueToString(list);
        const sqlList = list.map((item) => MeeSqlClass.insertSQL({ table, entry: item }));
        const sql = sqlList.join(";\n") + ";";
        await db.db.exec(sql);
        return c.text("インポート完了しました！")
      }
    }
  }
  return c.text("インポートに失敗しました", 500);
})

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