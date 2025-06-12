import { autoPostId } from "~/components/functions/media/blogFunction";
import { IsLogin, LoginCheck } from "~/components/utils/Admin";
import { MeeSqlD1 } from "~/data/functions/MeeSqlD1";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { postsDataOptions } from "~/data/DataEnv";
import { UpdateTablesDataObject } from "./DBTablesObject";
import type { GetDataProps } from "./propsDef";
import type { Route } from "./+types/blog";
import { getCfDB } from "~/data/cf/getEnv";

const TableObject = new DBTableClass<PostDataType>({
  table: postsDataOptions.name,
  createEntry: {
    id: { primary: true },
    postId: { type: "TEXT", unique: true, notNull: true },
    title: { type: "TEXT" },
    body: { type: "TEXT" },
    category: { type: "TEXT" },
    pin: { type: "INTEGER" },
    noindex: { type: "INTEGER" },
    draft: { type: "INTEGER" },
    memo: { type: "INTEGER" },
    time: { createAt: true, index: true },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["postId", "title", "body", "category", "pin", "draft", "noindex", "memo"],
  insertEntryTimes: ["time", "lastmod"]
});
export const postTableObject = TableObject;

export async function ServerPostsGetData({ searchParams, db, isLogin }: GetDataProps) {
  const wheres: MeeSqlFindWhereType<PostDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  if (!isLogin) wheres.push({ lastmod: { lte: new Date().toISOString() } });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  const postId = searchParams.get("postId");
  if (postId) wheres.push({ postId });
  async function Select() {
    return TableObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map((v) => v.draft ? { ...v, ...TableObject.getFillNullEntry, draft: v.draft } : v));
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: postsDataOptions }))
    .then(() => Select()));
}

export async function ServerPostsGetRssData(db: MeeSqlD1, take = 10) {
  return await TableObject.Select({
    db,
    where: {
      OR: [{ draft: null }, { draft: 0 }],
      lastmod: { lte: new Date().toISOString() }
    },
    take,
    orderBy: [{ time: "desc" }],
  })
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
            const { id, postId, update, ...data } = await request.json() as PostFormType;
            const entry = TableObject.getInsertEntry(data);
            if (postId !== update) entry.postId = postId;
            const target = update
              ? (await TableObject.Select({ db, where: { postId: update }, take: 1 }))[0]
              : undefined;
            entry.lastmod = await TableObject.getClassifyScheduleValue({
              db,
              time: data.time,
              existTime: target?.time,
            });
            if (target) {
              await TableObject.Update({ db, entry, where: { postId: update } });
              return Response.json({ ...target, ...entry, }, { status: 200 });
            } else {
              if (!entry.postId) entry.postId = autoPostId();
              await TableObject.Insert({ db, entry });
              return Response.json(entry, { status: 201 });
            }
          }
          case "DELETE": {
            const data: any = await request.json();
            const postId = String(data.postId || "");
            if (postId) {
              try {
                await TableObject.Update({
                  db,
                  entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
                  where: { postId }
                });
                return new Response(postId);
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
            idKey: "postId",
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
