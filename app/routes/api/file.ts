import { LoginCheck } from "~/components/utils/Admin";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import { getBasename, getName } from "~/components/functions/doc/PathParse";
import { UpdateTablesDataObject } from "./DBTablesObject";
import { filesDataOptions, filesDefaultDir } from "~/data/DataEnv";
import type { GetDataProps } from "./propsDef";
import type { Route } from "./+types/file";
import { getCfDB } from "~/data/cf/getEnv";
import { sha256 } from "~/components/functions/crypto";
import { getMimeType } from "~/components/utils/mime";

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

function getMtimeFromLastModified(lastModified: number) {
  const time = new Date(lastModified);
  return time.toISOString();
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
            if (formData.has("update")) {
              const idStr = formData.get("id") as string | null;
              const id = idStr ? Number(idStr) : NaN;
              const text = formData.get("text") as string | null;
              if (!isNaN(id) || text) {
                const data = {} as KeyValueType<unknown>;
                const key = formData.get("key") as string | null;
                if (key !== null) data.key = key;
                const src = formData.get("src") as string | null;
                if (src !== null) data.src = src;
                const privateParam = formData.get("private") as string | null;
                const isPrivate = privateParam ? Boolean(Number(privateParam)) : null;
                if (isPrivate !== null) data.private = isPrivate;
                const now = new Date();
                const entry = TableObject.getInsertEntry(data);
                entry.lastmod = now.toISOString();
                now.setMilliseconds(now.getMilliseconds() + 1);
                const target = typeof id === "number" && id >= 0
                  ? (await TableObject.Select({ db, where: { id }, take: 1 }))[0]
                  : undefined;
                const targetSrc = target?.src || src;
                let newFile: R2ObjectBody | File | null = null;
                if (text !== null && targetSrc) {
                  const mime = getMimeType(targetSrc);
                  const textFile = new File([text], getName(targetSrc), { type: mime })
                  entry.mtime = getMtimeFromLastModified(textFile.lastModified);
                  newFile = textFile;
                }
                if (env.BUCKET) {
                  if (!newFile && src && target?.src && src !== target.src) {
                    newFile = await env.BUCKET.get(target.src);
                  }
                  const uploadSrc = src || target?.src;
                  if (newFile && uploadSrc) {
                    if (target?.src) await env.BUCKET.delete(target.src);
                    await env.BUCKET.put(uploadSrc, await newFile.arrayBuffer());
                  }
                }
                entry.key = data.key;
                if (target) {
                  await TableObject.Update({ db, entry, take: 1, where: { id: id! } });
                } else {
                  await TableObject.Insert({ db, entry });
                }
                return Response.json({ type: target ? "update" : "create", entry: { ...target, ...entry } }, { status: target ? 200 : 201 });
              }
              return Response.json({ type: "error" }, { status: 403 });
            } else {
              if (file) {
                const key = (formData.get("key") || getBasename(file.name)) as string;
                const selectValue = await TableObject.Select({ db, where: { key } })
                const value = selectValue[0];
                const privateParam = (formData.get("private") as string);
                const dirParam = (formData.get("dir") as string) ?? filesDefaultDir;
                const uploadDir = (dirParam && !dirParam.endsWith("/")) ? dirParam + "/" : dirParam;
                const updateSrc = uploadDir + file.name;
                const src = value?.src ? value.src : updateSrc;
                const mtime = getMtimeFromLastModified(file.lastModified);
                const entry = TableObject.getInsertEntry({
                  src,
                  mtime,
                  lastmod: new Date().toISOString()
                });
                if (privateParam) entry.private = Number(privateParam);
                if (value && env.BUCKET) {
                  await env.BUCKET.delete(src);
                  await env.BUCKET.put(updateSrc, file);
                }
                else if (!value || value.mtime !== entry.mtime) {
                  if (env.BUCKET) await env.BUCKET.put(src, file);
                }
                if (value) {
                  if (src !== updateSrc) {
                    entry.src = updateSrc;
                  }
                  await TableObject.Update({ db, entry, where: { key } });
                } else {
                  entry.key = key;
                  await TableObject.Insert({ db, entry });
                }
              }
              return new Response("");
            }
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
      .then(async data => isLogin ? data : await Promise.all(
        data.map(async v => v.private ? { ...v, ...TableObject.getFillNullEntry, private: v.private, key: await sha256(v.key) } : v))
      )
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: filesDataOptions }))
    .then(() => Select()));
}
