import { Hono } from "hono";
import { MeeSqlD1 } from "@/functions/MeeSqlD1";

export const app = new Hono<MeeBindings<MeeAPIEnv>>({
  strict: false,
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
  mtime: { createAt: true, unique: true },
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
  const endpoint = searchParams.get("endpoint");
  if (endpoint) wheres.push({ mtime: { gt: endpoint } });
  const id = searchParams.get("id");
  if (id) wheres.push({ id });
  const index = searchParams.get("index");
  if (index) wheres.push({ index: Number(index) });
  function Select() {
    return db.select<ImageDataType>({ table, where: { AND: wheres } });
  }
  return Select().catch(() => CreateTable(db).then(() => Select()));
}

app.post("/send", async (c, next) => {
  const db = new MeeSqlD1(c.env.DB);
  const formData = (await c.req.parseBody()) as KeyValueType<unknown>;
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
  const entry: MeeSqlEntryType<CharacterDataType> = {
    name: formData.name,
    honorific: formData.honorific,
    defEmoji: formData.defEmoji,
    overview: formData.overview,
    icon: formData.icon,
    headerImage: formData.headerImage,
    image: formData.image,
    time: formData.time
      ? new Date(String(formData.time)).toISOString()
      : undefined,
    birthday: formData.birthday
      ? new Date(String(formData.birthday)).toISOString()
      : undefined,
    tags: formData.tags,
    playlist: formData.playlist,
    description: formData.description,
  };
  if (target) {
    entry.id = formData.id;
    await db.update<CharacterDataType>({
      table,
      entry,
      where: { id: target_id! },
      rawEntry: { mtime: MeeSqlD1.isoFormat() },
    });
    return c.json({ ...target, ...entry, }, 200);
  } else {
    entry.id = formData.id || target_id;
    await db.insert<CharacterDataType>({ table, entry });
    return c.json(entry, 201);
  }
});

export const app_character_api = app;
