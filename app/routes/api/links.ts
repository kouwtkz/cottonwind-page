import { LoginCheck } from "~/components/utils/Admin";
import { lastModToUniqueNow } from "~/components/functions/doc/ToFunction";
import { DBTableClass, type DBTableClassTemplateProps } from "./DBTableClass";
import { TablesDataObject, UpdateTablesDataObject } from "./DBTablesObject";
import { linksDataOptions } from "~/data/DataEnv";
import type { GetDataProps } from "./propsDef";
import type { RouteBasePropsWithEnvProps } from "~/components/utils/RoutesUtils";
import { getCfDB } from "~/data/cf/getEnv";
import type { Route } from "./+types/links";

interface SiteLinkServerClassProps extends Props_LastmodMHClass_Options<SiteLink, SiteLinkData> {
  table?: string;
  album?: string;
}
export class SiteLinkServerClass<A> {
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
  async next({ params, request, context, env }: RouteBasePropsWithEnvProps<{ action: string }>) {
    const TableObject = this.object;
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
                return Response.json(results, { status: results.some(({ type }) => type === "create") ? 201 : 200 });
              });
            }
            case "DELETE": {
              const data: any = await request.json();
              const id = data.id;
              if (typeof id === "number") {
                try {
                  await TableObject.Update({
                    db,
                    entry: { ...TableObject.getFillNullEntry, lastmod: new Date().toISOString() },
                    where: { id }
                  });
                  return id;
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
          if (db) {
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
                await TablesDataObject.Update({ db, where: { key: this.options.name }, entry: { version: this.options.version, lastmod } });
                return new Response("インポートしました！")
              }
            }
            return new Response("インポートに失敗しました", { status: 500 });
          }
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
}

export const SiteLinkServer = new SiteLinkServerClass<Route.ActionArgs>(linksDataOptions);
export async function action(props: Route.ActionArgs) {
  return LoginCheck({ ...props, next: SiteLinkServer.next.bind(SiteLinkServer), trueWhenDev: true });
}
