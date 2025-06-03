import { DBTableClass, DBTableImport } from "./DBTableClass";
import { UpdateTablesDataObject } from "./DBTablesObject";
import { charactersDataOptions } from "~/data/DataEnv";
import type { GetDataProps } from "./propsDef";
import { ImageBucketRename } from "./serverFunction";
import type { Route } from "./+types/character";
import { LoginCheck } from "~/components/utility/Admin";
import { getCfDB } from "~/data/cf/getEnv";
import { ImageTableObject } from "./image";

const TableObject = new DBTableClass<CharacterDataType>({
  table: charactersDataOptions.name,
  createEntry: {
    id: { primary: true },
    key: { type: "TEXT", unique: true, notNull: true },
    name: { type: "TEXT" },
    enName: { type: "TEXT" },
    honorific: { type: "TEXT" },
    nameGuide: { type: "TEXT" },
    defEmoji: { type: "TEXT" },
    overview: { type: "TEXT" },
    description: { type: "TEXT" },
    tags: { type: "TEXT" },
    order: { type: "INTEGER" },
    draft: { type: "INTEGER" },
    playlist: { type: "TEXT" },
    icon: { type: "TEXT" },
    image: { type: "TEXT" },
    headerImage: { type: "TEXT" },
    embed: { type: "TEXT" },
    birthday: { type: "TEXT" },
    time: { type: "TEXT" },
    lastmod: { createAt: true, unique: true },
  },
  insertEntryKeys: ["key", "name", "enName", "nameGuide", "honorific", "defEmoji", "overview", "description", "tags", "order", "draft", "playlist", "icon", "headerImage", "image"],
  insertEntryTimes: ["time", "birthday", "lastmod"]
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
            const rawData = await request.json();
            const data = Array.isArray(rawData) ? rawData : [rawData];
            const now = new Date();
            return Promise.all(
              data.map(async item => {
                const { id: _id, ...data } = item;
                const entry = TableObject.getInsertEntry(data);
                entry.lastmod = now.toISOString();
                now.setMilliseconds(now.getMilliseconds() + 1);
                const target_id = data.target || data.key;
                const target = target_id
                  ? (await TableObject.Select({ db, where: { key: target_id }, take: 1 }))[0]
                  : undefined;
                if (target) {
                  if (!entry.key && data.id) entry.key = data.id;
                  await TableObject.Update({ db, entry, take: 1, where: { key: target_id! } });
                  if (entry.key && entry.key !== target.key) {
                    const list = await ImageTableObject.Select({ db, where: { OR: [{ key: target.key }, { characters: { contains: target.key } }] } });
                    const time = new Date();
                    await Promise.all(
                      list.map((item) => {
                        const charactersList = item.characters?.split(",") || [target.key]
                        return ({
                          ...item, charactersList, index: charactersList.findIndex(v => v === target.key)
                        })
                      })
                        .filter(item => item.index >= 0)
                        .map(async item => {
                          const newKey = entry.key as string;
                          item.charactersList[item.index] = newKey;
                          const lastmod = time.toISOString();
                          time.setMilliseconds(time.getMilliseconds() + 1);
                          if (target.key === item.key) {
                            const entry: Partial<ImageDataType> = {
                              title: newKey, key: newKey, characters: item.charactersList.join(","), lastmod
                            };
                            if (env.BUCKET) await ImageBucketRename({ bucket: env.BUCKET, rename: newKey, image: item, entry });
                            await ImageTableObject.Update({
                              db,
                              where: { id: item.id },
                              entry,
                            });
                          } else {
                            await ImageTableObject.Update({
                              db,
                              where: { id: item.id },
                              entry: { characters: item.charactersList.join(","), lastmod },
                            });
                          }
                          return;
                        })
                    )
                  }
                  return { type: "update", entry: { ...target, ...entry } };
                } else {
                  entry.key = data.key || target_id;
                  await TableObject.Insert({ db, entry });
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

export async function ServerCharactersGetData({ searchParams, db, isLogin }: GetDataProps) {
  const wheres: MeeSqlFindWhereType<CharacterDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const key = searchParams.get("key");
  if (key) wheres.push({ key });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  async function Select() {
    return TableObject.Select({ db, where: { AND: wheres } })
      .then(data => isLogin ? data : data.map((v) => v.draft ? { ...v, ...TableObject.getFillNullEntry, draft: v.draft } : v));
  }
  return Select().catch(() => TableObject.CreateTable({ db })
    .then(() => UpdateTablesDataObject({ db, options: charactersDataOptions }))
    .then(() => Select()));
}

export const charaTableObject = TableObject;
