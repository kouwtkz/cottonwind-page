import { LoginCheck } from "~/components/utils/Admin";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { getName } from "~/components/functions/doc/PathParse";
import { UpdateTablesDataObject } from "./DBTablesObject";
import { soundsDataOptions } from "~/data/DataEnv";
import { soundAlbumTableObject } from "./soundAlbum";
import type { GetDataProps } from "./propsDef";
import type { Route } from "./+types/sound";
import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import MP3Tag from 'mp3tag.js';
import type { MP3TagTags } from "mp3tag.js/types/tags";

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
    composer: { type: "TEXT" },
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
export const soundTableObject = TableObject;

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
          case "POST": {
            const formData = await request.formData();
            const file = formData.get("file") as File | null;
            if (file && env.BUCKET) {
              let tags: Partial<MP3TagTags> = {};
              if (/\.mp3$/i.test(file.name)) {
                await file.arrayBuffer().then(buffer => {
                  const mp3tag = new MP3Tag(buffer);
                  mp3tag.read();
                  tags = mp3tag.tags;
                })
              }
              const src = "sound/" + file.name;
              const { track, title, album, year, artist, genre, v2 } = tags;
              const time = new Date(file.lastModified);
              const mtime = time.toISOString();
              if (year) time.setFullYear(Number(year));
              const key = getName(file.name);
              console.log(track);
              const entry = TableObject.getInsertEntry({
                title,
                album,
                composer: v2?.TCOM,
                artist,
                genre,
                src,
                track: track,
                grouping: v2?.TIT1?.split("\x00").join(","),
                time: time.toISOString(),
                mtime,
                lastmod: new Date().toISOString()
              });
              const selectValue = await TableObject.Select({ db, where: { key } })
              const value = selectValue[0];
              if (!value || value.mtime !== entry.mtime) {
                await env.BUCKET!.put(src, file);
              }
              if (album) {
                const albumValue = await soundAlbumTableObject.Select({ db, take: 1, where: { key: album } })
                  .then<SoundAlbumDataType | null>(v => v[0] || null);
                if (!albumValue) {
                  await soundAlbumTableObject.Insert({ db, entry: { key: album, title: album, lastmod: new Date().toISOString() } });
                }
              }
              if (value) {
                await TableObject.Update({ db, entry, where: { key } });
              } else {
                entry.key = key;
                await TableObject.Insert({ db, entry });
              }
              await env.BUCKET.put(src, file);
            }
            return new Response();
          }
          case "PATCH": {
            const rawData = await request.json();
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
              return Response.json(results, { status: results.some(({ type }) => type === "create") ? 201 : 200 });
            });
          }
          case "DELETE": {
            const data: any = await request.json();
            const key = data.target;
            if (key) {
              try {
                await TableObject.Update({
                  db,
                  entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
                  where: { key }
                });
                return key;
              } catch {
                return new Response("データベースでの削除に失敗しました", { status: 500 });
              }
            } else {
              return new Response("ID未指定です", { status: 500 });
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
          })
            .then(() => "インポートしました！")
            .catch(() => new Response("インポートに失敗しました", { status: 500 }));
      }
      break;
    case "all":
      if (import.meta.env?.DEV && request.method === "DELETE") {
        if (env.BUCKET) {
          const list = (await env.BUCKET.list({ prefix: "sound" })).objects.map(
            (object) => object.key
          );
          await env.BUCKET.delete(list);
        }
        const db = getCfDB({ context });
        if (db) {
          await TableObject.Drop({ db });
          return Response.json({ message: "successed!" });
        } else return Response.json({ message: "Undefined DB." });
      }
  }
  return "";
}
