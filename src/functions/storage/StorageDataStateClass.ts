import { StorageDataClass } from "./StorageDataClass";
import { corsFetch } from "../fetch";
import { setPrefix, setSuffix } from "../stringFix";
import { CreateState, CreateStateFunctionType } from "@/state/CreateState";
import { concatOriginUrl } from "../originUrl";

interface StorageDataStateClassProps<T> {
  src: string;
  key: string;
  version?: string;
  preLoad?: LoadStateType;
  isLogin?: LoadStateType;
  latestField?: { [k in keyof T]?: OrderByType };
  lastmodField?: string;
  scheduleEnable?: boolean;
}
export class StorageDataStateClass<T extends Object = {}> {
  storage: StorageDataClass<T[]>;
  key: string;
  src: string;
  version: string;
  useData = CreateState<T[]>();
  useLoad: CreateStateFunctionType<LoadStateType | undefined>;
  latestField?: { [k in keyof T]: OrderByType };
  latest?: T;
  lastmodField: string;
  beforeLastmod?: Date;
  scheduleEnable: boolean;
  private _isLogin?: boolean;
  get isLogin() {
    return this._isLogin;
  }
  set isLogin(isLogin) {
    this._isLogin = isLogin;
    this.storage.Version = setSuffix(
      this.version,
      this._isLogin ? "login" : ""
    );
  }
  constructor({
    src,
    key,
    version = "1",
    preLoad,
    isLogin,
    latestField,
    lastmodField = "lastmod",
    scheduleEnable = true
  }: StorageDataStateClassProps<T>) {
    this.version = version;
    this.key = key;
    this.storage = new StorageDataClass(key);
    this.src = src;
    this.useLoad = CreateState(preLoad);
    this.latestField = latestField as { [k in keyof T]: OrderByType };
    this.lastmodField = lastmodField;
    this.scheduleEnable = scheduleEnable;
    if (typeof isLogin === "boolean") this.isLogin = isLogin;
  }
  setSearchParamsOption({
    searchParams,
    loadValue,
    prefix,
  }: storageSetSearchParamsOptionProps<T>) {
    const { lastmod, data } = this.storage;
    if (!data) loadValue === "no-cache-reload";
    if (loadValue === "no-cache-reload") this.storage.removeItem();
    if (lastmod) searchParams.set(setPrefix("lastmod", prefix), lastmod);
    return searchParams;
  }
  async fetchData({
    src = this.src,
    apiOrigin,
    loadValue,
  }: storageFetchDataProps<T>) {
    const Url = new URL(concatOriginUrl(apiOrigin || location.origin, src));
    this.setSearchParamsOption({
      searchParams: Url.searchParams,
      loadValue: loadValue,
    });
    const cache = StorageDataStateClass.getCacheOption(loadValue);
    const isCacheReload = cache !== "no-cache-reload";
    if (!isCacheReload) Url.searchParams.delete("lastmod");
    if (cache) Url.searchParams.set("cache", cache);
    return corsFetch(Url.href, {
      cache: isCacheReload ? cache : undefined,
    }).then(async (r) => {
      return (await r.json()) as T[]
    });
  }
  async setData({
    data,
    setState,
    id = "id",
    lastmod = this.lastmodField,
  }: storageReadDataProps<T>) {
    if (!data) return;
    const { data: sData } = this.storage;
    if (sData) {
      if (this.latestField) {
        if (this.storage.lastmod)
          this.beforeLastmod = new Date(this.storage.lastmod);
        Object.entries<OrderByType>(this.latestField).forEach(([k, v]) => {
          this.latest = (sData as unknown as KeyValueType<any>[]).reduce<any>(
            (a, c) => {
              if (!a) return c;
              else {
                if (v === "desc") return a[k] > c[k] ? a : c;
                else if (v === "asc") return a[k] < c[k] ? a : c;
                else return a;
              }
            },
            undefined
          );
        });
      }
      data.forEach((d) => {
        const index = sData.findIndex((v) => (v as any)[id] === (d as any)[id]);
        if (index >= 0) {
          sData[index] = d;
        } else {
          sData.push(d);
        }
      });
      data = [...sData];
    }
    const now = new Date().toISOString();
    this.storage.setItem(
      data,
      data.reduce((a, c) => {
        const cm = ((c as any)[lastmod] || "") as string;
        if (now < cm && this.scheduleEnable) return a;
        return a > cm ? a : cm;
      }, "")
    );
    setState(data);
  }
  static getCacheOption(loadAtomValue?: LoadStateType) {
    return typeof loadAtomValue === "string" ? loadAtomValue : undefined;
  }
}
