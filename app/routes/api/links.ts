import { LoginCheck } from "~/components/utils/Admin";
import { lastModToUniqueNow } from "~/components/functions/doc/ToFunction";
import { DBTableClass, type DBTableClassTemplateProps } from "./DBTableClass";
import { TablesDataObject, UpdateTablesDataObject } from "./DBTablesObject";
import { linksDataOptions as ThisOptions } from "~/data/DataEnv";
import type { GetDataProps } from "./propsDef";
import type { RouteBasePropsWithEnvProps } from "~/components/utils/RoutesUtils";
import { getCfDB, getCfEnv } from "~/data/cf/getEnv";
import type { Route } from "./+types/links";

interface SiteLinkServerClassProps extends Props_LastmodMHClass_Options<SiteLink, SiteLinkData> {
  table?: string;
  album?: string;
}
export class SiteLinkServerClass {
  static template: DBTableClassTemplateProps<SiteLinkData> = {
    createEntry: {
      id: { primary: true },
      key: { type: "TEXT" },
      url: { type: "TEXT" },
      title: { type: "TEXT" },
      description: { type: "TEXT" },
      image: { type: "TEXT" },
      category: { type: "TEXT" },
      draft: { type: "INTEGER" },
      order: { type: "INTEGER" },
      prompt: { type: "TEXT" },
      password: { type: "TEXT" },
      lastmod: { createAt: true, unique: true },
    },
    insertEntryKeys: ThisOptions.insertEntryKeys,
    insertEntryTimes: ThisOptions.insertEntryTimes
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
  static autoSetLinkKey(links: SiteLinkData | SiteLinkData[]) {
    const list = Array.isArray(links) ? links : [links];
    const map = new Map<string, void>();
    list.forEach(v => {
      if (!v.key && v.url) {
        let Url: URL | undefined;
        if (v.url) {
          try {
            Url = new URL(v.url);
          } catch { }
          if (Url) {
            let handle = Url.hostname.replace(/\.?[^\.]+$/, "").replace(/^www\./, "");
            if (!handle) handle = Url.hostname;
            if (map.has(handle)) handle += Url.pathname;
            v.key = handle;
          }
        }
        if (!Url) {
          if (v.url) v.key = v.url;
          else if (v.title) v.key = v.title;
        }
        if (v.key) map.set(v.key);
      }
    })
    return list;
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
        .then(data => isLogin ? data : data.map((v) => {
          if (v.draft) {
            return { ...v, ...ThisObject.getFillNullEntry, draft: v.draft };
          } else {
            if (v.password) {
              v.url = null;
              v.password = "true";
            }
            return v;
          }
        }));
    }
    return Select().catch(() => ThisObject.CreateTable({ db })
      .then(() => UpdateTablesDataObject({ db, options: ThisOptions }))
      .then(() => Select()));
  }
  async verify(props: Route.ActionArgs) {
    if (props.request.method === "POST") {
      const db = getCfDB(props);
      const data = await props.request.json<any>();
      if (db && data) {
        const id = data.id;
        const results = await this.object.Select({ db, where: { AND: [{ id }] }, take: 1 })
        const entry = results[0];
        if (entry) {
          if (entry.password === data.password)
            return new Response(entry.url);
        }
      }
    }
    return new Response("failed", { status: 401 })
  }
  async next({ params, request, context }: RouteBasePropsWithEnvProps<{ action: string }>) {
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
                    SiteLinkServerClass.autoSetLinkKey(entry);
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
            const object = await request.json() as importEntryDataType<SiteLinkData>;
            if (object.data) {
              if (object.overwrite && object.first) {
                await TableObject.Drop({ db });
                await TableObject.CreateTable({ db });
              }
              const list = object.data;
              SiteLinkServerClass.autoSetLinkKey(list);
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

export const SiteLinkServer = new SiteLinkServerClass(ThisOptions);
export async function action(props: Route.ActionArgs) {
  if (props.params.action === "verify") return SiteLinkServer.verify.bind(SiteLinkServer)(props);
  else return LoginCheck({ ...props, next: SiteLinkServer.next.bind(SiteLinkServer), trueWhenDev: true });
}
