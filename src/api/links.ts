import { Hono } from "hono";
import { MeeSqlD1 } from "@src/data/functions/MeeSqlD1";
import { IsLogin } from "@src/admin";
import { lastModToUniqueNow } from "@src/functions/doc/ToFunction";
import { DBTableClass, DBTableClassTemplateProps } from "./DBTableClass";
import { TablesDataObject, UpdateTablesDataObject } from "./DBTablesObject";
import { linksFavDataOptions, linksDataOptions } from "@src/data/DataEnv";
import { GetDataProps } from "./propsDef";

export const app = new Hono<MeeBindings<MeeCommonEnv>>({
  strict: false,
});

app.use("*", async (c, next) => {
  if (IsLogin(c)) return next();
  else return c.text("403 Forbidden", 403)
});

interface SiteLinkServerClassProps extends Props_LastmodMHClass_Options<SiteLink, SiteLinkData> {
  table?: string;
  album?: string;
}
export class SiteLinkServerClass {
  static template: DBTableClassTemplateProps<SiteLinkData> = {
    createEntry: {
      id: { primary: true },
      url: { type: "TEXT" },
      title: { type: "TEXT" },
      description: { type: "TEXT" },
      image: { type: "TEXT" },
      category: { type: "TEXT" },
      style: { type: "TEXT" },
      draft: { type: "INTEGER" },
      order: { type: "INTEGER" },
      lastmod: { createAt: true, unique: true },
    },
    insertEntryKeys: ["url", "title", "description", "image", "category", "style", "order", "draft"],
    insertEntryTimes: ["lastmod"]
  };
  object: DBTableClass<SiteLinkData>;
  album?: string;
  options: Props_LastmodMHClass_Options<SiteLink, SiteLinkData>;
  constructor({ table, album, ...options }: SiteLinkServerClassProps) {
    if (!table) table = options.name;
    this.object = new DBTableClass({
      table,
      ...SiteLinkServerClass.template
    });
    this.options = options;
    this.album = album;
  }
  async getData({ searchParams, db, isLogin }: GetDataProps) {
    const ThisObject = this.object;
    const wheres: MeeSqlFindWhereType<SoundDataType>[] = [];
    const lastmod = searchParams.get("lastmod");
    if (lastmod) wheres.push({ lastmod: { gt: lastmod } });
    const key = searchParams.get("key");
    if (key) wheres.push({ key });
    const id = searchParams.get("id");
    if (id) wheres.push({ id: Number(id) });
    async function Select() {
      return ThisObject.Select({ db, where: { AND: wheres } })
        .then(data => isLogin ? data : data.map((v) => v.draft ? { ...v, ...ThisObject.getFillNullEntry, draft: v.draft } : v));
    }
    return Select().catch(() => ThisObject.CreateTable({ db })
      .then(() => UpdateTablesDataObject({ db, options: linksDataOptions }))
      .then(() => Select()));
  }
  apps() {
    const app = new Hono<MeeBindings<MeeCommonEnv>>({
      strict: false,
    });
    const TableObject = this.object;
    app.post("/send", async (c, next) => {
      const db = getCfDB({ context });;
      const rawData = await request.json();
      const data = Array.isArray(rawData) ? rawData : [rawData];
      const now = new Date();
      return Promise.all(
        data.map(async item => {
          const { id, ...data } = item;
          const entry = TableObject.getInsertEntry(data);
          entry.lastmod = now.toISOString();
          now.setMilliseconds(now.getMilliseconds() + 1);
          const target = id
            ? (await TableObject.Select({ db, where: { id }, take: 1 }))[0]
            : undefined;
          if (target) {
            await TableObject.Update({ db, entry, take: 1, where: { id } });
            return { type: "update", entry: { ...target, ...entry } };
          } else {
            await TableObject.Insert({ db, entry });
            return { type: "create", entry }
          }
        })
      ).then(results => {
        return c.json(results, results.some(({ type }) => type === "create") ? 201 : 200);
      });
    });
    app.post("/import", async (c, next) => {
      const db = getCfDB({ context });;
      const lastmod = new Date().toISOString();
      const object = await request.json() as importEntryDataType<CharacterDataType>;
      if (object.data) {
        if (object.overwrite && object.first) {
          await TableObject.Drop({ db });
          await TableObject.CreateTable({ db });
        }
        const list = object.data;
        if (Array.isArray(list)) {
          lastModToUniqueNow(list as KeyValueType<any>);
          for (const item of list) {
            await TableObject.Insert({ db, entry: TableObject.getInsertEntry(item) });
          }
          await TablesDataObject.Update({ db, where: { name: this.options.name }, entry: { version: this.options.version, lastmod } });
          return c.text("インポートしました！")
        }
      }
      return c.text("インポートに失敗しました", 500);
    })
    app.delete("/send", async (c) => {
      const data = await request.json();
      const id = data.id;
      if (id) {
        const db = getCfDB({ context });;
        try {
          await TableObject.Update({
            db,
            entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
            where: { id }
          });
          return c.text(id);
        } catch {
          return c.text("データベースでの削除に失敗しました", { status: 500 });
        }
      } else {
        return c.text("ID未指定です", { status: 500 });
      }
    });
    app.delete("/all", async (c, next) => {
      if (import.meta.env?.DEV) {
        const db = getCfDB({ context });;
        await TableObject.Drop({ db });
        return c.json({ message: "successed!" });
      }
      return next();
    });
    return app;
  }
}

export const SiteLinkServer = new SiteLinkServerClass(linksDataOptions);
app.route("/", SiteLinkServer.apps());
export const SiteFavLinkServer = new SiteLinkServerClass(linksFavDataOptions);
app.route("/fav", SiteFavLinkServer.apps());

export const app_links_api = app;
