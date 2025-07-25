import { customFetch } from "~/components/functions/fetch";
import { setPrefix, setSuffix } from "~/components/functions/stringFix";
import { CreateState } from "~/components/state/CreateState";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import { convertToMeeIndexedData, saveConvertMeeIndexedFromData } from "~/data/IndexedDB/ConvertToMeeIndexedData";
import { IndexedDataClass } from "./MeeIndexedDataClass";
import { AutoImageItemType, getImageAlbumMap } from "~/components/functions/media/imageFunction";
import { ArrayEnv } from "~/Env";

export class IndexedDataLastmodMH<
  T,
  D = T,
  TABLE_CLASS extends MeeIndexedDBTable<T> = MeeIndexedDBTable<T>,
> extends IndexedDataClass<T, Type_LastmodMH_Event, TABLE_CLASS> {
  options: Props_LastmodMHClass_Options<T, D>;
  key: string;
  src: string;
  version: string;
  idField: string;
  latestField?: { [k in keyof T]: OrderByType };
  latest?: Date;
  lastmodField: string;
  beforeLastmod?: Date;
  scheduleEnable: boolean;
  isLoad: LoadStateType;
  subscribeToLoad: EventCallback;
  isFirst: boolean;
  isUpgrade: boolean;
  private _isLogin?: boolean;
  constructor(options: Props_LastmodMHClass_Options<T, D>, table?: TABLE_CLASS) {
    const tableOptions: Props_MeeIndexedDBTable_Options_WithArg<T> = {
      name: options.name,
      primary: options.primary,
      secondary: options.secondary,
      defaultBusy: false
    }
    super(tableOptions, table);
    this.subscribeToLoad = this.getSubscribe("load");
    const {
      name: key,
      version = "1",
      primary: idField = "id",
      isLogin,
      latestField,
      lastmodField = "lastmod",
      scheduleEnable = true,
    } = options;
    this.options = options;
    this.version = version;
    this.idField = idField.toString();
    this.key = key;
    this.src = "/data/" + key;
    this.latestField = latestField as { [k in keyof T]: OrderByType };
    this.lastmodField = lastmodField;
    this.scheduleEnable = scheduleEnable;
    this.isLoad = false;
    this.isFirst = false;
    this.isUpgrade = false;
    if (typeof isLogin === "boolean") this.isLogin = isLogin;
  }
  override async dbUpgradeneeded(e: IDBVersionChangeEvent, db: IDBDatabase) {
    this.isUpgrade = true;
    if (e.oldVersion) {
      const request = e.target as IDBOpenDBRequest;
      const store = this.table.getStore(request.transaction!);
      await new Promise((s, j) => { const r = store.clear(); r.onsuccess = s; r.onerror = j });
    } else { this.isFirst = true; }
    return super.dbUpgradeneeded(e, db);
  }
  static GetVersion(version: string, { isLogin }: { isLogin?: boolean } = {}) {
    return setSuffix(version, isLogin ? "login" : "");
  }
  get isLogin() {
    return this._isLogin;
  }
  set isLogin(isLogin) {
    this._isLogin = isLogin;
    this.version = IndexedDataLastmodMH.GetVersion(this.version, {
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
  async dbSuccess(db: IDBDatabase) {
    this.table.dbSuccess(db);
    await this.setBeforeLastmod();
    this.emitEvent("update");
  }
  async setSearchParamsOption({
    searchParams,
    loadValue,
    prefix,
  }: Props_LastmodMH_SetSearchParamsOption<T>) {
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
  }: Props_LastmodMH_FetchData<T>) {
    const Url = new URL(concatOriginUrl(apiOrigin || location.origin, src));
    const cache = IndexedDataLastmodMH.getCacheOption(loadValue);
    const isCacheReload = cache !== "no-cache-reload";
    if (!isCacheReload) Url.searchParams.delete("lastmod");
    if (cache) Url.searchParams.set("cache", cache);
    return customFetch(Url.href, {
      cache: isCacheReload ? cache : undefined,
      cors: true
    }).then(async (r) => {
      return (await r.json()) as T[];
    });
  }
  override emitSwitchEvents(name: Type_LastmodMH_Event, arg1: any): void {
    super.emitSwitchEvents(name, arg1);
    switch (name) {
      case "load":
        const load: LoadStateType = arg1 ?? true;
        this.isLoad = load;
        break;
    }
  }
  load(load?: LoadStateType) {
    this.emitEvent("load", load);
  }
  override async save({ store, data }: Props_IndexedDataClass_NoCallback_Save<D>) {
    let callback: ((item: any) => Promise<T>) | undefined;
    if (this.options.convert) callback = (async (item) => {
      return await convertToMeeIndexedData<T, D>({ item, convert: this.options.convert! });
    })
    if (this.isUpgrade) this.isUpgrade = false;
    return super.save({
      store, data, callback,
      onsuccess: () => this.updateData(),
    });
  }
  static getCacheOption(loadAtomValue?: LoadStateType) {
    return typeof loadAtomValue === "string" ? loadAtomValue : undefined;
  }
}

export class ImageIndexedDataStateClass extends IndexedDataLastmodMH<ImageType, ImageDataType, ImageMeeIndexedDBTable> {
  override async updateData() {
    console.log(this, "updateData");
    return this.table.updateData({ lastmod: this.beforeLastmod });
  }
  override async dbSuccess(db: IDBDatabase) {
    await super.dbSuccess(db);
  }
}

export class ImageMeeIndexedDBTable extends MeeIndexedDBTable<ImageType> {
  imageAlbums: Map<string, ImageAlbumType>;
  constructor(props: Props_MeeIndexedDBTable_Options<ImageType>, db?: IDBDatabase) {
    super(props, db);
    this.imageAlbums = getImageAlbumMap(ArrayEnv.IMAGE_ALBUMS);
  }
  override async clone() {
    return new ImageMeeIndexedDBTable(this.options, this.db);
  }
  async getAlbums() {
    return this.find({ index: "album", direction: "nextunique" }).then(
      (images) => images.filter(image => image.album).map((image) => image.album!)
    );
  }
  async updateData({ lastmod }: { lastmod?: Date }) {
    let lastmodQuery: IDBKeyRange | IDBValidKey;
    lastmodQuery = IDBKeyRange.lowerBound(lastmod ?? new Date(0), true);
    return await this.usingUpdate<ImageType>({
      index: "lastmod", query: lastmodQuery, callback: (image) => {
        if (image) {
          const album = image.album ? this.imageAlbums.get(image.album) : null;
          image.type = image.type ? image.type : AutoImageItemType(image.embed, album?.type);
          return image;
        }
      }
    })
  }
}

type EventCallback = (callback: () => void) => () => void;
export function ExternalStoreProps<
  T,
  D = T,
  TABLE_CLASS extends MeeIndexedDBTable<T> = MeeIndexedDBTable<T>,
>(
  dataIndexed?: IndexedDataClass<T, D, TABLE_CLASS>
): [EventCallback, () => TABLE_CLASS | null, () => null] {
  return [
    dataIndexed?.subscribe || (() => () => { }),
    () => dataIndexed?.table || null,
    () => null
  ];
}