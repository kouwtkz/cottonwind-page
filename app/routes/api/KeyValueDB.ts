import { LoginCheck } from "~/components/utils/Admin";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { KeyValueDBDataOptions } from "~/data/DataEnv";
import { UpdateTablesDataObject } from "./DBTablesObject";
import type { GetDataProps } from "./propsDef";
import type { Route } from "./+types/KeyValueDB";
import { getCfDB } from "~/data/cf/getEnv";

const TableObject = new DBTableClass(KeyValueDBDataOptions);

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
            const now = new Date();
            let { key, update, ...data } = await request.json() as KeyValueSendType;
            if (key) {
              const entry = TableObject.getInsertEntry(data);
              const whereKey = update || key;
              const target = (await TableObject.Select({ db, where: { key: whereKey }, take: 1 }))[0];
              entry.lastmod = now.toISOString();
              entry.lastmod = await TableObject.getClassifyScheduleValue({
                db,
              });
              if (target) {
                if (update) entry.key = key;
                await TableObject.Update({ db, entry, where: { key: whereKey } });
                return Response.json({ ...target, ...entry, }, { status: 200 });
              } else {
                entry.key = key;
                await TableObject.Insert({ db, entry });
                return Response.json(entry, { status: 201 });
              }
            } else {
              return Response.json({ message: "keyが設定されていません" }, { status: 202 });
            }
          }
          case "DELETE": {
            const data: any = await request.json();
            const key = String(data.key || "");
            if (key) {
              try {
                await TableObject.Update({
                  db,
                  entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
                  where: { key }
                });
                return new Response(key);
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
            idKey: "key",
            kvConvertEntry: true,
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

export async function ServerKeyValueDBGetData({ searchParams, db, isLogin }: GetDataProps) {
  const ThisObject = TableObject;
  const wheres: MeeSqlFindWhereType<KeyValueDBType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const key = searchParams.get("key");
  if (key) wheres.push({ key });
  async function Select() {
    return ThisObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map(v => v.private ? { ...v, ...TableObject.getFillNullEntry, private: v.private } : v))
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: KeyValueDBDataOptions }))
    .then(() => Select()));
}
