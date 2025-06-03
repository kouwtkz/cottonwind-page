import { soundAlbumsDataOptions } from "~/data/DataEnv";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import type { GetDataProps } from "./propsDef";
import { UpdateTablesDataObject } from "./DBTablesObject";
import type { Route } from "./+types/soundAlbum";
import { LoginCheck } from "~/components/utility/Admin";
import { getCfDB } from "~/data/cf/getEnv";

const TableObject = new DBTableClass<SoundAlbumDataType>({
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
export const soundAlbumTableObject = TableObject;

export async function ServerSoundAlbumsGetData({ searchParams, db, isLogin }: GetDataProps) {
  const ThisObject = soundAlbumTableObject;
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
            const rawData = await request.json();
            const data = Array.isArray(rawData) ? rawData : [rawData];
            const now = new Date();
            return Promise.all(
              data.map(async item => {
                const { id: _id, ...data } = item as KeyValueType<unknown>;
                const entry = soundAlbumTableObject.getInsertEntry(data);
                entry.lastmod = now.toISOString();
                now.setMilliseconds(now.getMilliseconds() + 1);
                const target_id = data.target ? String(data.target) : undefined;
                const target = target_id
                  ? (await soundAlbumTableObject.Select({ db, where: { key: target_id }, take: 1 }))[0]
                  : undefined;
                if (target) {
                  entry.key = data.id;
                  await soundAlbumTableObject.Update({ db, entry, take: 1, where: { key: target_id! } });
                  return { type: "update", entry: { ...target, ...entry } };
                } else {
                  entry.key = data.id || target_id;
                  if (!entry.title) entry.title = entry.key;
                  await soundAlbumTableObject.Insert({ db, entry });
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
        const db = getCfDB({ context });
        if (db) {
          await TableObject.Drop({ db });
          return Response.json({ message: "successed!" });
        } else return Response.json({ message: "Undefined DB." });
      }
  }
  return "";
}
