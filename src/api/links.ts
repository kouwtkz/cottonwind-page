import { Hono } from "hono";
import { MeeSqlD1 } from "@/functions/MeeSqlD1";
import { IsLogin } from "@/admin";
import { lastModToUniqueNow } from "@/functions/doc/ToFunction";
import { PromiseOrder } from "@/functions/arrayFunction";
import { DBTableClass, DBTableClassTemplateProps } from "./DBTableClass";
import { getBasename } from "@/functions/doc/PathParse";

export const app = new Hono<MeeBindings<MeeAPIEnv>>({
  strict: false,
});

app.use("*", async (c, next) => {
  if (IsLogin(c)) return next();
  else return c.text("403 Forbidden", 403)
});

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
  constructor(table: string, options?: { album?: string }) {
    this.object = new DBTableClass({
      table,
      ...SiteLinkServerClass.template
    });
    this.album = options?.album;
  }
  async getData(searchParams: URLSearchParams, db: MeeSqlD1, isLogin?: boolean) {
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
        .then(data => isLogin ? data : data.map(v => v.draft ? { ...v, ...ThisObject.getFillNullEntry, key: null } : v));
    }
    return Select().catch(() => ThisObject.CreateTable({ db }).then(() => Select()));
  }
  apps() {
    const app = new Hono<MeeBindings<MeeAPIEnv>>({
      strict: false,
    });
    const TableObject = this.object;
    app.post("/send", async (c, next) => {
      const db = new MeeSqlD1(c.env.DB);
      const rawData = await c.req.json();
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
      const db = new MeeSqlD1(c.env.DB);
      const object = await c.req.json() as importEntryDataType<CharacterDataType>;
      if (object.data) {
        if (object.overwrite) {
          await TableObject.Drop({ db });
          await TableObject.CreateTable({ db });
        }
        const list = object.data;
        if (Array.isArray(list)) {
          lastModToUniqueNow(list as KeyValueType<any>);
          await PromiseOrder(list.map((item) => () =>
            TableObject.Insert({ db, entry: TableObject.getInsertEntry(item) })
          ), { sleepTime: 0 });
          return c.text("インポートしました！")
        }
      }
      return c.text("インポートに失敗しました", 500);
    })
    app.delete("/send", async (c) => {
      const data = await c.req.json();
      const key = data.target;
      if (key) {
        const db = new MeeSqlD1(c.env.DB);
        try {
          await TableObject.Update({
            db,
            entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
            where: { key }
          });
          return c.text(key);
        } catch {
          return c.text("データベースでの削除に失敗しました", { status: 500 });
        }
      } else {
        return c.text("ID未指定です", { status: 500 });
      }
    });
    app.delete("/all", async (c, next) => {
      if (c.env.DEV) {
        const db = new MeeSqlD1(c.env.DB);
        await TableObject.Drop({ db });
        return c.json({ message: "successed!" });
      }
      return next();
    });
    return app;
  }
}

export const SiteLinkServer = new SiteLinkServerClass("links");
app.route("/", SiteLinkServer.apps());
export const SiteFavLinkServer = new SiteLinkServerClass("favorite_links");
app.route("/fav", SiteFavLinkServer.apps());

export const app_links_api = app;
