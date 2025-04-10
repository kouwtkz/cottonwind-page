import { corsFetch } from "@/functions/fetch";
import { setPrefix, setSuffix } from "@/functions/stringFix";
import { CreateState } from "@/state/CreateState";
import { concatOriginUrl } from "@/functions/originUrl";
import { MeeIndexedDBTable } from "./MeeIndexedDB";
import { SetStateAction } from "react";
import { saveConvertMeeIndexedFromData } from "./ConvertToMeeIndexedData";
import { EventCallback, SubscribeEventsClass } from "@/components/hook/SubscribeEvents";

type IndexedDataStateEventType = "update" | "load";
export class IndexedDataStateClass<
  T,
  D = T,
  TABLE_CLASS extends MeeIndexedDBTable<T> = MeeIndexedDBTable<T>
> extends SubscribeEventsClass<IndexedDataStateEventType> {
  table: TABLE_CLASS;
  options: DataClassProps<T, D>;
  key: string;
  src: string;
  version: string;
  idField: string;
  latestField?: { [k in keyof T]: OrderByType };
  latest?: Date;
  lastmodField: string;
  beforeLastmod?: Date;
  scheduleEnable: boolean;
  isLoading: boolean;
  isSoloLoad: LoadStateType;
  private _isLogin?: boolean;
  static GetVersion(version: string, { isLogin }: { isLogin?: boolean } = {}) {
    return setSuffix(version, isLogin ? "login" : "");
  }
  get isLogin() {
    return this._isLogin;
  }
  set isLogin(isLogin) {
    this._isLogin = isLogin;
    this.version = IndexedDataStateClass.GetVersion(this.version, {
      isLogin: this._isLogin,
    });
  }
  async getLastmod() {
    const lastmodField = this.lastmodField as keyof T;
    return await this.table
      .find({ index: lastmodField, direction: "prev", take: 1 })
      .then((v) => v[0]?.[lastmodField]);
  }
  async setBeforeLastmod() {
    return await this.table
      .find({ index: this.lastmodField as keyof T, direction: "prev", take: 1 })
      .then((items) => {
        this.beforeLastmod = items[0]?.[this.lastmodField as keyof T] as
          | Date
          | undefined;
        return this.beforeLastmod;
      });
  }
  subscribe: EventCallback;
  subscribeToLoad: EventCallback;
  constructor(options: DataClassProps<T, D>, table?: TABLE_CLASS) {
    table = table ?? (new MeeIndexedDBTable({ options }) as TABLE_CLASS);
    super();
    this.table = table;
    this.subscribe = this.getSubscribe("update");
    this.subscribeToLoad = this.getSubscribe("load");
    const {
      src,
      key,
      version = "1",
      primary: idField = "id",
      preLoad,
      isLogin,
      latestField,
      lastmodField = "lastmod",
      scheduleEnable = true,
    } = options;
    this.options = options;
    this.version = version;
    this.idField = idField.toString();
    this.key = key;
    this.src = "/data" + src;
    this.latestField = latestField as { [k in keyof T]: OrderByType };
    this.lastmodField = lastmodField;
    this.scheduleEnable = scheduleEnable;
    this.isLoading = true;
    this.isSoloLoad = false;
    if (typeof isLogin === "boolean") this.isLogin = isLogin;
  }
  async dbSuccess(db: IDBDatabase) {
    this.table.dbSuccess(db);
    await this.setBeforeLastmod();
  }
  async setSearchParamsOption({
    searchParams,
    loadValue,
    prefix,
  }: DataClassTableSetSearchParamsOptionProps<T>) {
    let lastmod: Date | undefined = (await this.getLastmod()) as Date;
    if (!lastmod) loadValue === "no-cache-reload";
    if (loadValue === "no-cache-reload") this.table.clear();
    if (lastmod)
      searchParams.set(setPrefix("lastmod", prefix), lastmod?.toISOString());
    return searchParams;
  }
  async fetchData({
    src = this.src,
    apiOrigin,
    loadValue,
  }: DataClassTableFetchDataProps<T>) {
    const Url = new URL(concatOriginUrl(apiOrigin || location.origin, src));
    const cache = IndexedDataStateClass.getCacheOption(loadValue);
    const isCacheReload = cache !== "no-cache-reload";
    if (!isCacheReload) Url.searchParams.delete("lastmod");
    if (cache) Url.searchParams.set("cache", cache);
    return corsFetch(Url.href, {
      cache: isCacheReload ? cache : undefined,
    }).then(async (r) => {
      return (await r.json()) as T[];
    });
  }
  override emitSwitchEvents(name: IndexedDataStateEventType, arg1: any): void {
    switch (name) {
      case "update":
        break;
      case "load":
        const load: LoadStateType = arg1 ?? true;
        this.isSoloLoad = load;
        break;
    }
  }
  load(load?: LoadStateType) {
    this.emit("load", load);
  }
  async updateData() { }
  async setData(data: T[]) {
    this.isLoading = true;
    await saveConvertMeeIndexedFromData<T, D>({
      data,
      table: this.table,
      convert: this.options.convert
    });
    this.table = (await this.table.clone()) as TABLE_CLASS;
    this.emit("update");
    this.isLoading = false;
    await this.updateData();
  }
  static getCacheOption(loadAtomValue?: LoadStateType) {
    return typeof loadAtomValue === "string" ? loadAtomValue : undefined;
  }
}

type setStateFunction<C> = (args_0: SetStateAction<C | undefined>) => void;
interface readDataProps<T, C> {
  data?: T[];
  setState: setStateFunction<C>;
  id?: string;
  lastmod?: string;
}
