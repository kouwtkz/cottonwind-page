import { LoginCheck } from "~/components/utils/Admin";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { likeDataOptions } from "~/data/DataEnv";
import { UpdateTablesDataObject } from "./DBTablesObject";
import { toLikePath } from "~/components/functions/media/likeFunction";
import type { GetDataProps } from "./propsDef";
import { getIpAddress } from "./serverFunction";
import type { Route } from "./+types/like";
import { getCfDB } from "~/data/cf/getEnv";

const TableObject = new DBTableClass<LikeDataType>({
  table: likeDataOptions.name,
  createEntry: {
    path: { primary: true, type: "TEXT" },
    count: { default: 0, notNull: true },
    registed: { type: "TEXT", notNull: true },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["path", "count", "registed"],
  insertEntryTimes: ["lastmod"]
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
            const now = new Date();
            const { path: pathData, mode = "add" } = await request.json() as LikeFormType;
            const path = toLikePath(pathData);
            const target = (await TableObject.Select({ db, where: { path }, take: 1 }))[0];
            const address = getIpAddress(request);
            const registedData = getRegistedData(target?.registed);
            let count = target?.count || 0;
            if (mode === "add") {
              if (registedData.every(v => v !== address)) {
                registedData.push(address);
                count++;
              } else {
                return Response.json({ ...target }, { status: 200 });
              }
              const registed = JSON.stringify(registedData);
              if (target) {
                const entry = TableObject.getInsertEntry({ registed, count, lastmod: now.toISOString() });
                await TableObject.Update({ db, entry, where: { path } });
                return Response.json({ ...target, ...entry, }, { status: 200 });
              } else {
                const entry = TableObject.getInsertEntry({ path, registed, count, lastmod: now.toISOString() });
                await TableObject.Insert({ db, entry });
                return Response.json(entry, { status: 201 });
              }
            } else {
              if (target) {
                const found = registedData.findIndex(v => v === address);
                if (found >= 0) {
                  registedData.splice(found, 1);
                  count--;
                  const registed = JSON.stringify(registedData);
                  const entry = TableObject.getInsertEntry({ registed, count, lastmod: now.toISOString() });
                  await TableObject.Update({ db, entry, where: { path } });
                  return Response.json({ ...target, ...entry, }, { status: 200 });
                }
              }
              return Response.json({ ...target }, { status: 200 });
            }
          }
          case "DELETE": {
            const data: any = await request.json();
            const path = String(data.path || "");
            if (path) {
              try {
                await TableObject.Update({
                  db,
                  entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
                  where: { path }
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

function getRegistedData(registed?: string) {
  return JSON.parse(registed || "[]") as string[];
}

export async function ServerLikeGetData({ searchParams, db, isLogin, request }: GetDataProps) {
  const wheres: MeeSqlFindWhereType<LikeDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  if (!isLogin) wheres.push({ lastmod: { lte: new Date().toISOString() } });
  const path = searchParams.get("path");
  if (path) wheres.push({ path });
  const address = getIpAddress(request);
  async function Select() {
    return TableObject.Select({ db, where: { AND: wheres } })
      .then(data => data.map(v => {
        const registedData = getRegistedData(v.registed);
        if (!isLogin) v.registed = "";
        return ({ ...v, checked: registedData.some(v => v === address) });
      }));
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: likeDataOptions }))
    .then(() => Select()));
}
