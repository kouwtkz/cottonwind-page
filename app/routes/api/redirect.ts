import { LoginCheck } from "~/components/utils/Admin";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { redirectDataOptions } from "~/data/DataEnv";
import { UpdateTablesDataObject } from "./DBTablesObject";
import type { GetDataProps } from "./propsDef";
import type { Route } from "./+types/redirect";
import { getCfDB } from "~/data/cf/getEnv";

const TableObject = new DBTableClass(redirectDataOptions);

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
            let { update, id, redirect, path } = await request.json() as redirectSendType;
            let target: redirectDataType | undefined;
            const entry = TableObject.getInsertEntry({ redirect, path });
            if (update || typeof id === "number")
              if (update) {
                target = (await TableObject.Select({ db, where: { path: update }, take: 1 }))[0];
              } else {
                target = (await TableObject.Select({ db, where: { id }, take: 1 }))[0];
              }
            entry.lastmod = now.toISOString();
            entry.lastmod = await TableObject.getClassifyScheduleValue({
              db,
            });
            if (target) {
              if (update) entry.path = path;
              await TableObject.Update({ db, entry, where: { id: target.id } });
              return Response.json({ ...target, ...entry, }, { status: 200 });
            } else {
              entry.path = path;
              await TableObject.Insert({ db, entry });
              return Response.json(entry, { status: 201 });
            }
          }
          case "DELETE": {
            const { path, id } = await request.json() as any;
            if (path || typeof id === "number") {
              try {
                await TableObject.Update({
                  db,
                  entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
                  where: path ? { path: String(path) } : { id }
                });
                return new Response(path);
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
            idKey: "path",
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

export async function ServerRedirectGetData({ searchParams, db, isLogin }: GetDataProps) {
  const ThisObject = TableObject;
  const wheres: MeeSqlFindWhereType<redirectDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const path = searchParams.get("path");
  if (path) wheres.push({ path });
  async function Select() {
    return ThisObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map(v => v.private ? { ...v, ...TableObject.getFillNullEntry, private: v.private } : v))
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: redirectDataOptions }))
    .then(() => Select()));
}
