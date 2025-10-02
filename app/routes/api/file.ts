import { LoginCheck } from "~/components/utils/Admin";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { getBasename } from "~/components/functions/doc/PathParse";
import { UpdateTablesDataObject } from "./DBTablesObject";
import { filesDataOptions } from "~/data/DataEnv";
import type { GetDataProps } from "./propsDef";
import type { Route } from "./+types/file";
import { getCfDB } from "~/data/cf/getEnv";

const TableObject = new DBTableClass<FilesRecordDataType>({
  table: filesDataOptions.name,
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT", unique: true, notNull: true },
    src: { type: "TEXT" },
    private: { type: "INTEGER" },
    mtime: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "src", "private"],
  insertEntryTimes: ["mtime", "lastmod"]
});
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
            if (file) {
              const key = (formData.get("key") || getBasename(file.name)) as string;
              const selectValue = await TableObject.Select({ db, where: { key } })
              const value = selectValue[0];
              const src = value?.src ? value.src : "files/" + file.name;
              const time = new Date(file.lastModified);
              const mtime = time.toISOString();
              const entry = TableObject.getInsertEntry({
                src,
                mtime,
                lastmod: new Date().toISOString()
              });
              if (value && env.BUCKET) {
                await env.BUCKET.delete(src);
                await env.BUCKET.put(src, file);
              }
              else if (!value || value.mtime !== entry.mtime) {
                if (env.BUCKET) await env.BUCKET.put(src, file);
              }
              if (value) {
                await TableObject.Update({ db, entry, where: { key } });
              } else {
                entry.key = key;
                await TableObject.Insert({ db, entry });
              }
            }
            return new Response("");
          }
          case "PATCH": {
            const rawData = await request.json();
            const data = Array.isArray(rawData) ? rawData : [rawData];
            const now = new Date();
            return Promise.all(
              data.map(async item => {
                const { id, ...data } = item as KeyValueType<unknown>;
                const entry = TableObject.getInsertEntry(data);
                entry.lastmod = now.toISOString();
                now.setMilliseconds(now.getMilliseconds() + 1);
                const target = id
                  ? (await TableObject.Select({ db, where: { id }, take: 1 }))[0]
                  : undefined;
                if (target) {
                  entry.key = data.key;
                  if (env.BUCKET && entry.src && target.src && entry.src !== target.src) {
                    const rename = String(entry.src);
                    const object = await env.BUCKET.get(target.src);
                    if (object) {
                      await env.BUCKET.put(rename, await object.arrayBuffer());
                      await env.BUCKET.delete(target.src);
                    }
                  }
                  await TableObject.Update({ db, entry, take: 1, where: { id: id! } });
                  return { type: "update", entry: { ...target, ...entry } };
                }
              })
            ).then(results => {
              return Response.json(results);
            });
          }
          case "DELETE": {
            const data: any = await request.json();
            const id = data.id;
            if (typeof data.id === "number") {
              const values = (await TableObject.Select({ db, params: "*", where: { id } }))[0];
              try {
                if (env.BUCKET && values.src) await env.BUCKET.delete(values.src);
                await TableObject.Update({
                  db,
                  entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
                  where: { id }
                });
                return new Response(id);
              } catch {
                return new Response("データベースでの削除に失敗しました", { status: 500 });
              }
            }
            return new Response("削除するデータがありません");
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
export async function ServerFilesGetData({ searchParams, db, isLogin }: GetDataProps) {
  const ThisObject = TableObject;
  const wheres: MeeSqlFindWhereType<FilesRecordDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const key = searchParams.get("key");
  if (key) wheres.push({ key });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  async function Select() {
    return ThisObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map(v => v.private ? { ...v, ...TableObject.getFillNullEntry, private: v.private } : v))
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: filesDataOptions }))
    .then(() => Select()));
}
