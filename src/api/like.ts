import { Hono, HonoRequest } from "hono";
import { IsLogin } from "@src/admin";
import { MeeSqlD1 } from "@src/data/functions/MeeSqlD1";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { likeDataOptions } from "@src/data/DataEnv";
import { UpdateTablesDataObject } from "./DBTablesObject";
import { toLikePath } from "@src/functions/likeFunction";
import { GetDataProps } from "./propsDef";
import { getIpAddress } from "./serverFunction";

export const app = new Hono<MeeBindings>();

app.use("*", async (c, next) => {
  if (
    IsLogin(c)
    || (c.req.method === "POST" && c.req.path.endsWith("/send"))
  ) return next();
  else return c.text("403 Forbidden", 403);
});

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

function getRegistedData(registed?: string) {
  return JSON.parse(registed || "[]") as string[];
}

export async function ServerLikeGetData({ searchParams, db, isLogin, req }: GetDataProps) {
  const wheres: MeeSqlFindWhereType<LikeDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  if (!isLogin) wheres.push({ lastmod: { lte: new Date().toISOString() } });
  const path = searchParams.get("path");
  if (path) wheres.push({ path });
  const address = getIpAddress(req);
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

app.post("/send", async (c, next) => {
  const now = new Date();
  const db = new MeeSqlD1(c.env.DB);
  const { path: pathData, mode = "add" } = await c.req.json() as LikeFormType;
  const path = toLikePath(pathData);
  const target = (await TableObject.Select({ db, where: { path }, take: 1 }))[0];
  const address = getIpAddress(c.req);
  const registedData = getRegistedData(target?.registed);
  let count = target?.count || 0;
  if (mode === "add") {
    if (registedData.every(v => v !== address)) {
      registedData.push(address);
      count++;
    } else {
      return c.json({ ...target }, 200);
    }
    const registed = JSON.stringify(registedData);
    if (target) {
      const entry = TableObject.getInsertEntry({ registed, count, lastmod: now.toISOString() });
      await TableObject.Update({ db, entry, where: { path } });
      return c.json({ ...target, ...entry, }, 200);
    } else {
      const entry = TableObject.getInsertEntry({ path, registed, count, lastmod: now.toISOString() });
      await TableObject.Insert({ db, entry });
      return c.json(entry, 201);
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
        return c.json({ ...target, ...entry, }, 200);
      }
    }
    return c.json({ ...target }, 200);
  }
});

app.delete("/send", async (c) => {
  const data = await c.req.json();
  const path = String(data.path || "");
  if (path) {
    const db = new MeeSqlD1(c.env.DB);
    try {
      await TableObject.Update({
        db,
        entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
        where: { path }
      });
      return c.text(path);
    } catch {
      return c.text("データベースでの削除に失敗しました", { status: 500 });
    }
  } else {
    return c.text("ID未指定です", { status: 500 });
  }
});

app.post("/import", async (c) => {
  return DBTableImport({
    db: new MeeSqlD1(c.env.DB),
    object: await c.req.json(),
    TableObject,
    idKey: "path",
    kvConvertEntry: true,
  })
    .then(() => c.text("インポートしました！"))
    .catch(() => c.text("インポートに失敗しました", 500));
});

app.delete("/all", async (c, next) => {
  if (import.meta.env?.DEV) {
    const db = new MeeSqlD1(c.env.DB);
    await TableObject.Drop({ db });
    return c.json({ message: "successed!" });
  }
  return next();
});

export const app_like_api = app;
