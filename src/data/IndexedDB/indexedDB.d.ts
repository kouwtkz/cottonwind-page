type Type_MeeIndexedDB_Event = "update";

interface Props_DataStateOptions<T> {
  key: string;
  src?: string;
  primary?: keyof T | "id" | "rowid";
  secondary?: Array<keyof T>;
  version?: number;
  versionOnServer?: number;
  latestField?: { [k in keyof T]?: OrderByType };
  lastmodField?: string;
}

type onupgradeneededFunction = (e: IDBVersionChangeEvent, db: IDBDatabase) => void | Promise<void>;
type onsuccessFunction = (db: IDBDatabase) => void | Promise<void>;

interface Props_MeeIndexedDB {
  dbName: string;
  version?: number;
  forceDeleteDatabase?: boolean;
  onupgradeneeded?: onupgradeneededFunction;
  onsuccess?: onsuccessFunction;
}

interface Props_MeeIndexedDB_Using extends Props_MeeIndexedDB {
  callback(indexdedClass: MeeIndexedDB, db: IDBDatabase): void | Promise<void>;
}

interface Props_MeeIndexedDBTable_Options<T> {
  name: string;
  primary?: keyof T | "id" | "rowid";
  secondary?: Array<keyof T>;
}

interface Props_MeeIndexedDBTable_Options_WithArg<T> extends Props_MeeIndexedDBTable_Options<T> {
  defaultBusy?: boolean;
}

interface Props_IndexedDataClass_Save<T = any> {
  data: T[];
  callback?(item: T): any | Promise<any>;
  store?: IDBObjectStore;
}
