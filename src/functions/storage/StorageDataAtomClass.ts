import { atom, PrimitiveAtom, SetStateAction } from "jotai";
import { StorageDataClass } from "./StorageDataClass";
import { corsFetch } from "../fetch";
import { setPrefix } from "../prefix";

interface StorageDataAtomClassProps {
  src: string;
  key: string;
  version?: string;
  preLoad?: LoadAtomType;
}
export class StorageDataAtomClass<T extends Object = {}> {
  storage: StorageDataClass<T[]>;
  src: string;
  dataAtom = atom<T[]>();
  loadAtom: PrimitiveAtom<LoadAtomType | undefined>;
  constructor({ src, key, version, preLoad }: StorageDataAtomClassProps) {
    this.storage = new StorageDataClass(key, version);
    this.src = src;
    this.loadAtom = atom(preLoad);
  }
  setSearchParamsOption({
    searchParams,
    loadAtomValue,
    prefix,
  }: storageSetSearchParamsOptionProps<T>) {
    if (loadAtomValue === "no-cache-reload") this.storage.removeItem();
    const { lastmod: sEndpoint } = this.storage;
    if (sEndpoint) searchParams.set(setPrefix("lastmod", prefix), sEndpoint);
    return searchParams;
  }
  async fetchData({
    src = this.src,
    apiOrigin,
    loadAtomValue,
  }: storageFetchDataProps<T>) {
    const Url = new URL(src, apiOrigin || location.href);
    this.setSearchParamsOption({
      searchParams: Url.searchParams,
      loadAtomValue,
    });
    const cache = StorageDataAtomClass.getCacheOption(loadAtomValue);
    if (cache) Url.searchParams.set("cache", cache);
    return corsFetch(Url.href, {
      cache: cache !== "no-cache-reload" ? cache : undefined,
    }).then(async (r) => (await r.json()) as T[]);
  }
  async setData({
    data,
    setAtom,
    id = "id",
    lastmod = "lastmod",
  }: storageReadDataProps<T>) {
    if (!data) return;
    const { data: sData } = this.storage;
    if (sData) {
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
    this.storage.setItem(
      data,
      data.reduce((a, c) => {
        const cm = ((c as any)[lastmod] || "") as string;
        return a > cm ? a : cm;
      }, "")
    );
    setAtom(data);
  }
  static getCacheOption(loadAtomValue?: LoadAtomType) {
    return typeof loadAtomValue === "string" ? loadAtomValue : undefined;
  }
}

