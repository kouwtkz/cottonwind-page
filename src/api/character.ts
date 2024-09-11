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
  index: { primary: true },
  id: { type: "TEXT", unique: true, notNull: true },
  name: { type: "TEXT" },
  honorific: { type: "TEXT" },
  defEmoji: { type: "TEXT" },
  overview: { type: "TEXT" },
  description: { type: "TEXT" },
  tags: { type: "TEXT" },
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
  const id = searchParams.get("id");
  if (id) wheres.push({ id });
  const index = searchParams.get("index");
  if (index) wheres.push({ index: Number(index) });
  function Select() {
    return db.select<CharacterDataType>({ table, where: { AND: wheres } });
  }
  return Select().catch(() => CreateTable(db).then(() => Select()));
}

function InsertEntry(data: KeyValueType<any>): MeeSqlEntryType<CharacterDataType> {
  return {
    id: data.id,
    name: data.name,
    honorific: data.honorific,
    defEmoji: data.defEmoji,
    overview: data.overview,
    icon: data.icon,
    headerImage: data.headerImage,
    image: data.image,
    time: data.time
      ? new Date(String(data.time)).toISOString()
      : undefined,
    birthday: data.birthday
      ? new Date(String(data.birthday)).toISOString()
      : undefined,
    tags: data.tags,
    playlist: data.playlist,
    description: data.description,
  };
}

app.post("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const { id: _id, ...formData } = (await c.req.parseBody()) as KeyValueType<unknown>;
  const entry = InsertEntry(formData);
  const target_id = formData.target ? String(formData.target) : undefined;
  const target = target_id
    ? (
      await db.select<CharacterDataType>({
        table,
        where: { id: target_id },
        take: 1,
      })
    )[0]
    : undefined;
  if (target) {
    entry.id = formData.id;
    await db.update<CharacterDataType>({
      table,
      entry,
      where: { id: target_id! },
      rawEntry: { lastmod: MeeSqlD1.isoFormat() },
    });
    return c.json({ ...target, ...entry, }, 200);
  } else {
    entry.id = formData.id || target_id;
    await db.insert<CharacterDataType>({ table, entry });
    return c.json(entry, 201);
  }
});

app.post("/import", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const formData = await c.req.parseBody();
  if (typeof formData.data === "string") {
    if (formData.version === "0") {
      await db.dropTable({ table });
      await CreateTable(db);
      const list = JSON.parse(formData.data) as KeyValueType<unknown>[];
      if (Array.isArray(list)) {
        lastModToUniqueNow(list);
        KeyValueToString(list);
        await Promise.all(list.map((item) => db.insert({ table, entry: InsertEntry(item) })));
        return c.text("インポート完了しました！")
      }
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
