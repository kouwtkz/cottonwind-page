import { Hono } from "hono";
import { optimizeImage } from "wasm-image-optimization";
import { Response } from "@cloudflare/workers-types/experimental";
import { getExtension, getName } from "@/functions/doc/PathParse";
import { imageDimensionsFromStream } from "image-dimensions";
import { MeeSqlD1 } from "@/functions/MeeSqlD1";

export const app = new Hono<{ Bindings: MeeAPIEnv; Response: Response }>({
  strict: false,
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
  copyright: { type: "TEXT" },
  link: { type: "TEXT" },
  embed: { type: "TEXT" },
  type: { type: "TEXT" },
  topImage: { type: "INTEGER" },
  pickup: { type: "INTEGER" },
  time: { type: "TEXT", unique: true },
  mtime: { createAt: true, unique: true },
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

app.get("/data", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const Url = new URL(c.req.url);
  const wheres: MeeSqlFindWhereType<ImageDataType>[] = [];
  const endpoint = Url.searchParams.get("endpoint");
  if (endpoint) wheres.push({ mtime: { gt: endpoint } });
  const id = Url.searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  const src = Url.searchParams.get("src");
  if (src) wheres.push({ src });
  function Select() {
    return db.select<ImageDataType>({ table, where: { AND: wheres } })
  }
  return c.json(
    await Select().catch(() => CreateTable(db).then(() => Select()))
  );
});

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
    tags: BlankStringsToNull(charaTags, otherTags),
    name,
    time: time ? new Date(time).toISOString() : time,
    mtime: new Date().toISOString(),
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
      entry: { ...nullEntry, mtime: new Date().toISOString() },
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

type ModeType = "webp" | "thumbnail" | "icon";
app.post("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const formData = (await c.req.parseBody()) as KeyValueType<unknown>;
  const attached = (formData.attached as File | undefined) || null;
  const mtime = (formData.mtime as string | undefined) || null;
  const album = (formData["album"] as string | undefined) || null;
  const tags = (formData["tags"] as string | undefined) || null;
  const pathes: { [k in ModeType]?: string } = {};
  const webp = typeof formData.webp === "string" ? null : formData.webp as File | undefined;
  const thumbnail = typeof formData.thumbnail === "string" ? null : formData.thumbnail as File | undefined;
  const icon = typeof formData.icon === "string" ? null : formData.icon as File | undefined;
  const filename = attached?.name || webp?.name || thumbnail?.name || icon?.name;
  const name = filename ? getName(filename) : "";
  const id = typeof formData.id === "string" ? Number(formData.id) : null;
  async function fileModeUpload(mode: ModeType, file?: File | null) {
    if (file) {
      const image = await file.arrayBuffer();
      pathes[mode] = "image/" + mode + "/" + file.name;
      if (pathes[mode]) await c.env.BUCKET.put(pathes[mode], image);
    }
  }
  await fileModeUpload("webp", webp);
  await fileModeUpload("thumbnail", thumbnail);
  await fileModeUpload("icon", icon);
  if (attached) {
    const image = await attached.arrayBuffer();
    const imagePath = "image/" + attached.name;
    await c.env.BUCKET.put(imagePath, image);
    const arr = new Uint8Array(image);
    const blob = new Blob([arr]);
    const ext = getExtension(attached.name);
    const metaSize = await imageDimensionsFromStream(blob.stream());
    switch (ext) {
      case "svg":
        break;
      default:
        const webpName = name + ".webp";
        if (typeof webp === "undefined") {
          const webpImage = await optimizeImage({
            format: "webp",
            image,
          });
          if (webpImage) pathes.webp = "image/webp/" + webpName;
          if (pathes.webp) await c.env.BUCKET.put(pathes.webp, webpImage);
        }
        if (typeof thumbnail === "undefined") {
          const thumbnailImage = await Resize({
            image,
            format: "webp",
            metaSize,
            quality: 80,
            size: c.env.THUMBNAIL_SIZE ?? 320,
          });
          if (thumbnailImage)
            pathes.thumbnail = "image/thumbnail/" + webpName;
          if (pathes.thumbnail)
            await c.env.BUCKET.put(pathes.thumbnail, thumbnailImage);
        }
        break;
    }
    function Select() {
      const where: MeeSqlFindWhereType<ImageDataType> = id === null ? { src: imagePath } : { id };
      return db.select({ table, where })
    }
    const selectValue = await Select().catch(() => CreateTable(db).then(() => Select()));
    if (selectValue.length > 0) {
      const value = selectValue[0];
      const Update = (time?: string) =>
        db.update<ImageDataType>({
          table,
          where: { src: imagePath },
          entry: {
            name,
            album,
            ...pathes,
            tags,
            time,
            version: (value.version ?? 0) + 1
          },
          rawEntry: { mtime: MeeSqlD1.isoFormat() },
        });
      if (value.time) {
        await Update();
      } else {
        const timeNum = Number(mtime);
        const time = mtime ? new Date(isNaN(timeNum) ? mtime : timeNum) : new Date();
        await Update(time.toISOString()).catch(async (e) => {
          const retryTime = await getRetryTime(e, time, db);
          if (retryTime) await Update(retryTime.toISOString());
        });
      }
    } else {
      const timeNum = Number(mtime);
      const time = mtime ? new Date(isNaN(timeNum) ? mtime : timeNum) : new Date();
      const Insert = (time: string) =>
        db.insert<ImageDataType>({
          table,
          entry: {
            name,
            album,
            time,
            src: imagePath,
            ...pathes,
            ...metaSize,
            tags,
            version: 1,
          },
        });
      await Insert(time.toISOString()).catch(async (e) => {
        const retryTime = await getRetryTime(e, time, db);
        if (retryTime) await Insert(retryTime.toISOString());
      });
    }
  }
  return c.newResponse(null);
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
