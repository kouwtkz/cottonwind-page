import { soundAlbumsDataOptions } from "~/data/DataEnv";
import { DBTableClass, DBTableImport } from "./DBTableClass";
import type { GetDataProps } from "./propsDef";
import { UpdateTablesDataObject } from "./DBTablesObject";
import type { Route } from "./+types/soundAlbum";
import { LoginCheck } from "~/components/utils/Admin";
import { getCfDB } from "~/data/cf/getEnv";
import { soundTableObject } from "./sound";
import { sha256 } from "~/components/functions/crypto";

const TableObject = new DBTableClass(soundAlbumsDataOptions);
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
    return TableObject.Select({ db, where: { AND: wheres } })
      .then(async data => isLogin ? data : await Promise.all(
        data.map(async v => (v.draft)
          ? { ...v, ...TableObject.getFillNullEntry, draft: v.draft, key: await sha256(v.key), extendData: { secret: true } }
          : v)));
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
                  if (entry.key) {
                    const defaultNow = new Date();
                    const soundEntry: MeeSqlEntryType<SoundDataType> = { album: entry.key };
                    const sounds = await soundTableObject.Select({ db, where: { album: target.key } });
                    await Promise.all(sounds.map(async (sound, i) => {
                      const now = new Date(defaultNow);
                      if (i > 0) now.setMilliseconds(now.getMilliseconds() + i);
                      soundEntry.lastmod = now.toISOString();
                      await soundTableObject.Update({ db, where: { key: sound.key }, entry: soundEntry });
                    }));
                  }
                  await soundAlbumTableObject.Update({ db, entry, take: 1, where: { key: target_id! } });
                  return { type: "update", entry: { ...target, ...entry } };
                } else {
                  if (!entry.key) entry.key = data.id || target_id;
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
                  where: { key },
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
