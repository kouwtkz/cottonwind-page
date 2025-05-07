import { Hono } from "hono";
import { MeeSqlD1 } from "@/data/functions/MeeSqlD1";
import { IsLogin } from "@/admin";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { parseBlob } from 'music-metadata';
import { getName } from "@/functions/doc/PathParse";
import { UpdateTablesDataObject } from "./DBTablesObject";
import { soundAlbumsDataOptions, soundsDataOptions } from "@/data/DataEnv";
import { GetDataProps } from "./propsDef";

export const app = new Hono<MeeBindings<MeeCommonEnv>>({
  strict: false,
});

const TableObject = new DBTableClass<SoundDataType>({
  table: soundsDataOptions.name,
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT", unique: true, notNull: true },
    src: { type: "TEXT" },
    track: { type: "INTEGER" },
    title: { type: "TEXT" },
    description: { type: "TEXT" },
    album: { type: "TEXT" },
    cover: { type: "TEXT" },
    artist: { type: "TEXT" },
    grouping: { type: "TEXT" },
    genre: { type: "TEXT" },
    draft: { type: "INTEGER" },
    time: { createAt: true, index: true },
    mtime: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "src", "track", "title", "description", "album", "cover", "artist", "grouping", "genre", "draft"],
  insertEntryTimes: ["time", "mtime", "lastmod"]
});

const AlbumTableObject = new DBTableClass<SoundAlbumDataType>({
  table: soundAlbumsDataOptions.name,
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT", unique: true, notNull: true },
    title: { type: "TEXT" },
    description: { type: "TEXT" },
    cover: { type: "TEXT" },
    artist: { type: "TEXT" },
    order: { type: "TEXT" },
    category: { type: "TEXT" },
    setup: { type: "INTEGER" },
    draft: { type: "INTEGER" },
    time: { createAt: true, index: true },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "title", "description", "cover", "artist", "order", "category", "setup", "draft"],
  insertEntryTimes: ["time", "lastmod"]
});

app.use("*", async (c, next) => {
  if (IsLogin(c)) return next();
  else return c.text("403 Forbidden", 403)
});

export async function ServerSoundsGetData({ searchParams, db, isLogin }: GetDataProps) {
  const ThisObject = TableObject;
  const wheres: MeeSqlFindWhereType<SoundDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const key = searchParams.get("key");
  if (key) wheres.push({ key });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  async function Select() {
    return ThisObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map((v) => v.draft ? { ...v, ...TableObject.getFillNullEntry, draft: v.draft } : v));
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: soundsDataOptions }))
    .then(() => Select()));
}

export async function ServerSoundAlbumsGetData({ searchParams, db, isLogin }: GetDataProps) {
  const ThisObject = AlbumTableObject;
  const wheres: MeeSqlFindWhereType<SoundAlbumDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const key = searchParams.get("key");
  if (key) wheres.push({ key });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  async function Select() {
    return ThisObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map((v) => v.draft ? { ...v, ...TableObject.getFillNullEntry, draft: v.draft } : v));
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: soundAlbumsDataOptions }))
    .then(() => Select()));
}

app.patch("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const rawData = await c.req.json();
  const data = Array.isArray(rawData) ? rawData : [rawData];
  const now = new Date();
  return Promise.all(
    data.map(async item => {
      const { id: _id, ...data } = item as KeyValueType<unknown>;
      const entry = TableObject.getInsertEntry(data);
      entry.lastmod = now.toISOString();
      now.setMilliseconds(now.getMilliseconds() + 1);
      const target_id = data.target ? String(data.target) : undefined;
      const target = target_id
        ? (await TableObject.Select({ db, where: { key: target_id }, take: 1 }))[0]
        : undefined;
      if (target) {
        entry.key = data.id;
        await TableObject.Update({ db, entry, take: 1, where: { key: target_id! } });
        return { type: "update", entry: { ...target, ...entry } };
      } else {
        entry.key = data.id || target_id;
        await TableObject.Insert({ db, entry });
        return { type: "create", entry }
      }
    })
  ).then(results => {
    return c.json(results, results.some(({ type }) => type === "create") ? 201 : 200);
  });
});

app.post("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (file) {
    await parseBlob(file).then(async (meta) => {
      const { track, grouping, year, ...common } = meta.common;
      const time = new Date(file.lastModified);
      const mtime = time.toISOString();
      if (year) time.setFullYear(year);
      const src = "sound/" + file.name;
      const key = getName(file.name);
      const entry = TableObject.getInsertEntry({
        ...common,
        src,
        track: track.no,
        grouping: (grouping?.split("\x00") || []).join(","),
        time: time.toISOString(),
        mtime,
        lastmod: new Date().toISOString()
      });
      const selectValue = await TableObject.Select({ db, where: { key } })
      const value = selectValue[0];
      if (!value || value.mtime !== entry.mtime) {
        await c.env.BUCKET.put(src, file);
      }
      const album = meta.common.album;
      if (album) {
        const albumValue = await AlbumTableObject.Select({ db, take: 1, where: { key: album } })
          .then<SoundAlbumDataType | null>(v => v[0] || null);
        if (!albumValue) {
          await AlbumTableObject.Insert({ db, entry: { key: album, title: album, lastmod: new Date().toISOString() } });
        }
      }
      if (value) {
        await TableObject.Update({ db, entry, where: { key } });
      } else {
        entry.key = key;
        await TableObject.Insert({ db, entry });
      }
    })
  }
  return c.text("");
});

app.post("/import", async (c, next) => {
  return DBTableImport({
    db: new MeeSqlD1(c.env.DB),
    object: await c.req.json(),
    TableObject,
  })
    .then(() => c.text("インポートしました！"))
    .catch(() => c.text("インポートに失敗しました", 500));
});

app.delete("/all", async (c, next) => {
  if (import.meta.env?.DEV) {
    const list = (await c.env.BUCKET.list({ prefix: "sound" })).objects.map(
      (object) => object.key
    );
    await c.env.BUCKET.delete(list);
    const db = new MeeSqlD1(c.env.DB);
    await TableObject.Drop({ db });
    return c.json({ message: "successed!" });
  }
  return next();
});

app.patch("/album/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const rawData = await c.req.json();
  const data = Array.isArray(rawData) ? rawData : [rawData];
  const now = new Date();
  return Promise.all(
    data.map(async item => {
      const { id: _id, ...data } = item as KeyValueType<unknown>;
      const entry = AlbumTableObject.getInsertEntry(data);
      entry.lastmod = now.toISOString();
      now.setMilliseconds(now.getMilliseconds() + 1);
      const target_id = data.target ? String(data.target) : undefined;
      const target = target_id
        ? (await AlbumTableObject.Select({ db, where: { key: target_id }, take: 1 }))[0]
        : undefined;
      if (target) {
        entry.key = data.id;
        await AlbumTableObject.Update({ db, entry, take: 1, where: { key: target_id! } });
        return { type: "update", entry: { ...target, ...entry } };
      } else {
        entry.key = data.id || target_id;
        if (!entry.title) entry.title = entry.key;
        await AlbumTableObject.Insert({ db, entry });
        return { type: "create", entry }
      }
    })
  ).then(results => {
    return c.json(results, results.some(({ type }) => type === "create") ? 201 : 200);
  });
});

export const app_sound_api = app;
