import { Hono, HonoRequest } from "hono";
import { IsLogin } from "@/admin";
import { MeeSqlD1 } from "@/functions/database/MeeSqlD1";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { likeDataOptions } from "@/dataDef";
import { UpdateTablesDataObject } from "./DBTablesObject";
import { toLikePath } from "@/functions/likeFunction";
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
  table: likeDataOptions.key,
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
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  const postId = searchParams.get("postId");
  if (postId) wheres.push({ postId });
  const address = getIpAddress(req);
  async function Select() {
    return TableObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map(v => {
        const registedData = getRegistedData(v.registed);
        if (registedData.some(v => v === address)) {
          return ({ ...v, registed: "registed" })
        } else {
          return ({ ...v, registed: "" })
        }
      }));
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: likeDataOptions }))
    .then(() => Select()));
}

app.post("/send", async (c, next) => {
  const now = new Date();
  const db = new MeeSqlD1(c.env.DB);
  const { path: pathData } = await c.req.json() as LikeFormType;
  const path = toLikePath(pathData);
  const target = (await TableObject.Select({ db, where: { path }, take: 1 }))[0];
  const address = getIpAddress(c.req);
  const registedData = getRegistedData(target?.registed);
  let count = target?.count || 0;
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
});

app.delete("/send", async (c) => {
  const data = await c.req.json();
  const postId = String(data.postId || "");
  if (postId) {
    const db = new MeeSqlD1(c.env.DB);
    try {
      await TableObject.Update({
        db,
        entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
        where: { postId }
      });
      return c.text(postId);
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
