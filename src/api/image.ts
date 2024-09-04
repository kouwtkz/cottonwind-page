import { Hono } from "hono";
import { optimizeImage } from "wasm-image-optimization";
import { Response } from "@cloudflare/workers-types/experimental";
import { getName } from "@/functions/doc/PathParse";
import { getMimeType } from "hono/utils/mime";
import { imageDimensionsFromStream } from "image-dimensions";
import { MeeSqlD1 } from "@/functions/MeeSqlD1";

export const app = new Hono<{ Bindings: MeeAPIEnv; Response: Response }>({
  strict: false,
});

interface ImageDataType {
  id?: number;
  name?: string;
  album?: string;
  src?: string;
  webp?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  tags?: string;
  date?: string;
  updated?: string;
}

const table = "images";

async function createImageDatabase(d1: MeeSqlD1) {
  await d1
    .createTable<ImageDataType>({
      table,
      entry: {
        id: { primary: true },
        name: { type: "TEXT" },
        album: { type: "TEXT" },
        src: { type: "TEXT", unique: true },
        webp: { type: "TEXT", unique: true },
        thumbnail: { type: "TEXT" },
        width: { type: "INTEGER" },
        height: { type: "INTEGER" },
        tags: { type: "TEXT" },
        date: { type: "TEXT", unique: true },
        updated: { createAt: true, unique: true },
      },
    })
    .catch(() => { });
}

async function Resize({
  image,
  size,
  quality,
  format,
  metaSize,
}: {
  image: BufferSource;
  size?: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp";
  metaSize?: { width: number; height: number };
}) {
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
  if (width ?? height) {
    return await optimizeImage({
      format,
      image,
      width,
      height,
      quality,
    });
  } else return null;
}

function arrayFromFormdata<T = unknown>(
  formData: KeyValueType<unknown>,
  key: string
) {
  const data = formData[key];
  return data ? ((Array.isArray(data) ? data : [data]) as T[]) : undefined;
}

app.get("/data", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const Url = new URL(c.req.url);
  const wheres: MeeSqlFindWhereType<ImageDataType>[] = [];
  const endpoint = Url.searchParams.get("endpoint");
  if (endpoint) wheres.push({ updated: { gt: endpoint } });
  const id = Url.searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  const src = Url.searchParams.get("src");
  if (src) wheres.push({ src });
  return c.json(
    await db.select<ImageDataType>({ table, where: { AND: wheres } })
  );
});

app.post("/upload", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  await createImageDatabase(db);
  const formData = (await c.req.parseBody()) as KeyValueType<unknown>;
  const attachedList = arrayFromFormdata<File>(formData, "attached[]") ?? [];
  const mtimeList =
    arrayFromFormdata<string>(formData, "attached_mtime[]") ?? [];
  const album = String(formData["dir"] ?? "");
  const tags = arrayFromFormdata<string>(formData, "tags[]")?.join(",") ?? "";
  await Promise.all(
    attachedList
      .map((attached, i) => ({
        attached,
        mtime: new Date(Number(mtimeList[i])).toISOString(),
      }))
      .map(async ({ attached, mtime }) => {
        const image = await attached.arrayBuffer();
        const imagePath = "image/" + "src/" + attached.name;
        await c.env.BUCKET.put(imagePath, image);
        const arr = new Uint8Array(image);
        const blob = new Blob([arr]);
        const name = getName(attached.name);
        const webpName = name + ".webp";
        const webpImage = await optimizeImage({
          format: "webp",
          image,
        });
        const webpImagePath = webpImage ? "image/" + webpName : undefined;
        if (webpImagePath) await c.env.BUCKET.put(webpImagePath, webpImage);
        const metaSize = await imageDimensionsFromStream(blob.stream());
        const thumbnailImage = await Resize({
          image,
          format: "webp",
          metaSize,
          quality: 80,
          size: c.env.THUMBNAIL_SIZE ?? 320,
        });
        const thumbnailImagePath = thumbnailImage
          ? "image/" + "thumbnail/" + webpName
          : undefined;
        if (thumbnailImagePath)
          await c.env.BUCKET.put(thumbnailImagePath, thumbnailImage);
        if (
          await db.exists<ImageDataType>({ table, where: { src: imagePath } })
        ) {
          await db.update<ImageDataType>({
            table,
            where: { src: imagePath },
            entry: {
              name,
              album,
              date: mtime,
              webp: webpImagePath,
              thumbnail: thumbnailImagePath,
              tags,
            },
            rawEntry: { updated: MeeSqlD1.isoFormat() },
          });
        } else {
          await db.insert<ImageDataType>({
            table,
            entry: {
              name,
              album,
              date: mtime,
              src: imagePath,
              webp: webpImagePath,
              thumbnail: thumbnailImagePath,
              ...metaSize,
              tags,
            },
          });
        }
      })
  );
  return c.newResponse(null);
});

app.get("*", async (c, next) => {
  if (c.env.DEV) {
    const Url = new URL(c.req.url);
    const pathname = decodeURI(Url.pathname);
    const filename = pathname.slice(pathname.indexOf("/", 1) + 1);
    if (filename) {
      const mimeType = getMimeType(filename);
      const item = await c.env.BUCKET.get("image/" + filename);
      const b = await item?.blob();
      if (b)
        return c.body(await b.arrayBuffer(), {
          headers: mimeType ? { "Content-Type": mimeType } : {},
        });
    }
  }
  return next();
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
