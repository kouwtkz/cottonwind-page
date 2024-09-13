import { Hono } from "hono";
import { MeeSqlD1 } from "@/functions/MeeSqlD1";
import { IsLogin } from "@/ServerContent";
import { MeeSqlClass } from "@/functions/MeeSqlClass";
import { KeyValueToString, lastModToUniqueNow } from "@/functions/doc/ToFunction";

export const app = new Hono<MeeBindings<MeeAPIEnv>>({
  strict: false,
});

app.use("*", async (c, next) => {
  if (IsLogin(c)) return next();
  else return c.text("403 Forbidden", 403)
});

const table = "characters";
const createEntry: MeeSqlCreateTableEntryType<CharacterDataType> = {
  id: { primary: true },
  key: { type: "TEXT", unique: true, notNull: true },
  name: { type: "TEXT" },
  honorific: { type: "TEXT" },
  defEmoji: { type: "TEXT" },
  overview: { type: "TEXT" },
  description: { type: "TEXT" },
  tags: { type: "TEXT" },
  order: { type: "INTEGER" },
  playlist: { type: "TEXT" },
  icon: { type: "TEXT" },
  image: { type: "TEXT" },
  headerImage: { type: "TEXT" },
  embed: { type: "TEXT" },
  birthday: { type: "TEXT" },
  time: { type: "TEXT" },
  lastmod: { createAt: true, unique: true },
};

async function CreateTable(d1: MeeSqlD1) {
  await d1
    .createTable({
      table,
      entry: createEntry,
    })
    .catch(() => { });
}

export async function ServerCharactersGetData(searchParams: URLSearchParams, db: MeeSqlD1) {
  const wheres: MeeSqlFindWhereType<CharacterDataType>[] = [];
  const lastmod = searchParams.get("lastmod");
  if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
  const key = searchParams.get("key");
  if (key) wheres.push({ key });
  const id = searchParams.get("id");
  if (id) wheres.push({ id: Number(id) });
  function Select() {
    return db.select<CharacterDataType>({ table, where: { AND: wheres } });
  }
  return Select().catch(() => CreateTable(db).then(() => Select()));
}

function InsertEntry(data: KeyValueType<any>): MeeSqlEntryType<CharacterDataType> {
  return {
    key: data.key,
    name: data.name,
    honorific: data.honorific,
    defEmoji: data.defEmoji,
    overview: data.overview,
    description: data.description,
    tags: data.tags,
    order: data.order,
    playlist: data.playlist,
    icon: data.icon,
    headerImage: data.headerImage,
    image: data.image,
    time: data.time
      ? new Date(String(data.time)).toISOString()
      : undefined,
    birthday: data.birthday
      ? new Date(String(data.birthday)).toISOString()
      : undefined,
    lastmod: data.lastmod,
  };
}

app.post("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const rawData = await c.req.json();
  const data = Array.isArray(rawData) ? rawData : [rawData];
  const now = new Date();
  return Promise.all(
    data.map(async item => {
      const { id: _id, ...data } = item as KeyValueType<unknown>;
      const entry = InsertEntry(data);
      entry.lastmod = now.toISOString();
      now.setMilliseconds(now.getMilliseconds() + 1);
      const target_id = data.target ? String(data.target) : undefined;
      const target = target_id
        ? (
          await db.select<CharacterDataType>({
            table,
            where: { key: target_id },
            take: 1,
          })
        )[0]
        : undefined;
      if (target) {
        entry.key = data.id;
        await db.update<CharacterDataType>({
          table,
          entry,
          where: { key: target_id! },
        });
        return { type: "update", entry: { ...target, ...entry } };
      } else {
        entry.key = data.id || target_id;
        await db.insert<CharacterDataType>({
          table, entry,
        });
        return { type: "create", entry }
      }
    })
  ).then(results => {
    return c.json(results, results.some(({ type }) => type === "create") ? 201 : 200);
  });
});

app.post("/import", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const object = await c.req.json() as importEntryDataType<KeyValueType<unknown>>;
  if (object.data) {
    if (object.overwrite) {
      await db.dropTable({ table });
      await CreateTable(db);
    }
    const list = object.data;
    if (Array.isArray(list)) {
      lastModToUniqueNow(list);
      KeyValueToString(list);
      await Promise.all(list.map((item) => db.insert({ table, entry: InsertEntry(item) })));
      return c.text("インポートしました！")
    }
  }
  return c.text("インポートに失敗しました", 500);
})
app.delete("/all", async (c, next) => {
  if (c.env.DEV) {
    const db = new MeeSqlD1(c.env.DB);
    await db.dropTable({ table });
    return c.json({ message: "successed!" });
  }
  return next();
});

export const app_character_api = app;
