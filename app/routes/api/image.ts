import { getBasename, getName } from "~/components/functions/doc/PathParse";
import { imageDimensionsFromData } from "image-dimensions";
import { KeyValueConvertDBEntry } from "~/components/functions/doc/ToFunction";
import { JoinUnique } from "~/components/functions/doc/StrFunctions";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { UpdateTablesDataObject } from "./DBTablesObject";
import { ImageDataOptions } from "~/data/DataEnv";
import type { GetDataProps } from "./propsDef";
import { ImageBucketRename } from "./serverFunction";
import type { Route } from "./+types/image";
import { LoginCheck } from "~/components/utils/Admin";
import { getCfDB } from "~/data/cf/getEnv";

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

export async function action(props: Route.ActionArgs) {
  return LoginCheck({ ...props, next, trueWhenDev: true });
}

interface WithEnvProps extends Route.ActionArgs {
  env: Partial<Env>;
}
async function next({ params, request, context, env }: WithEnvProps) {
  switch (params.action) {
    case "send":
      const db = getCfDB({ context })!;
      if (db) {
        switch (request.method) {
          case "PATCH": {
            const item = await request.json<KeyValueAnyType>();
            const now = new Date();
            const nowString = now.toISOString();
            now.setMilliseconds(now.getMilliseconds() + 1);
            let {
              id,
              rename,
              ...values
            } = item as unknown as imageUpdateJsonDataType;
            const entry: MeeSqlEntryType<ImageDataType> = values;
            const value = (await TableObject.Select({ db, where: { id } }))[0];
            entry.lastmod = nowString;
            if (rename) {
              if (value && env.BUCKET) {
                entry.key = rename;
                await ImageBucketRename({ bucket: env.BUCKET, rename, image: value, entry });
              }
            }
            KeyValueConvertDBEntry(entry);
            return await TableObject.Update({ db, entry, where: { id } });
          }
          case "DELETE": {
            const data = await request.json<KeyValueAnyType>();
            if (typeof data.id === "number") {
              const values = (await TableObject.Select({ db, params: "*", where: { id: data.id } }))[0];
              if (env?.BUCKET) {
                if (values.src) env.BUCKET.delete(values.src);
                if (values.thumbnail) env.BUCKET.delete(values.thumbnail);
              }
              const nullEntry = TableObject.getFillNullEntry;
              await TableObject.Update({ db, entry: { ...nullEntry, lastmod: new Date().toISOString() }, where: { id: data.id } });
              return values.src + "を削除しました";
            }
            return "削除するデータがありません";
          }
          case "POST": {
            const formData = await request.formData();
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
            else return new Response("fileがオブジェクトではありません", { status: 500 })
            if (typeof thumbnail !== "string") await fileModeUpload("thumbnail", thumbnail);
            else return new Response("thumbnailがオブジェクトではありません", { status: 500 })
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
              if (meta) metaSize = { width: meta.width, height: meta.height };
            }
            const pathes = Object.fromEntries(
              Object.entries(images).map(([k, v]) => [k, v.path || null])
            );
            const selectValues = await Select().catch(() =>
              TableObject.CreateTable({ db }).then(() => Select())
            );
            const value = selectValues[0] ? selectValues[0] : null;
            const bucket = env.BUCKET;
            if (bucket && images.src?.buf) await bucket.put(images.src.path, images.src.buf);
            if (bucket && images.thumbnail?.buf) {
              await bucket.put(images.thumbnail.path, images.thumbnail.buf);
            } else if (value?.thumbnail) {
              if (bucket) await bucket.delete(value.thumbnail);
              pathes.thumbnail = null;
            }
            const timeString = new_mtime.toISOString();
            if (value) {
              if (bucket && images.src?.path && value.src && (images.src.path !== value.src)) {
                await bucket.delete(value.src);
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
              return { ...value, ...entry };
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
              return entry;
            }
          }
        }
        break;
      }
    case "import":
      if (request.method === "POST") {
        const db = getCfDB({ context });
        if (db)
          return DBTableImport({
            db,
            object: await request.json(),
            TableObject,
            kvConvertEntry: true,
          })
            .then(() => "インポートしました！")
            .catch(() => new Response("インポートに失敗しました", { status: 500 }));
      }
      break;
    case "compat-merge":
      if (request.method === "POST") {
        const db = getCfDB({ context });
        if (db) {
          const object = await request.json() as {
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
              if (env.BUCKET && item.webp && item.icon) await env.BUCKET.delete(item.icon);
              const oldSrc = item.src;
              const webSrc = item.webp || item.icon || item.src;
              if (webSrc) {
                if (webSrc.startsWith("image/webp/") || webSrc.startsWith("image/icon/")) {
                  const newSrc = "image/" + getBasename(webSrc);
                  item.src = newSrc;
                  const value = await env.BUCKET?.get(webSrc);
                  if (value && env.BUCKET) {
                    const buf = (await value?.arrayBuffer())!;
                    if (oldSrc !== newSrc) {
                      await env.BUCKET.put(newSrc, buf);
                      if (oldSrc) await env.BUCKET.delete(oldSrc);
                    }
                    await env.BUCKET.delete(webSrc);
                  }
                  await TableObject.Update({
                    db,
                    where: { key: item.key },
                    entry: { src: newSrc, lastmod },
                  })
                }
              }
            }));
          return "";
        }
      }
      break;
    case "item":
      if (import.meta.env?.DEV && request.method === "DELETE") {
        const Url = new URL(request.url);
        const filename = Url.searchParams.get("path");
        if (filename) {
          await env.BUCKET?.delete("image/" + filename);
        }
        return "successed!";
      }
      break;
    case "all":
      if (import.meta.env?.DEV && request.method === "DELETE") {
        let list: string[];
        if (env.BUCKET) {
          list = (await env.BUCKET.list({ prefix: "image" })).objects.map(
            (object) => object.key
          );
          await env.BUCKET.delete(list);
        } else list = [];
        const db = getCfDB({ context })!;
        if (db) await TableObject.Drop({ db });
        return { message: "successed!", list };
      }
  }
  return "";
}

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
