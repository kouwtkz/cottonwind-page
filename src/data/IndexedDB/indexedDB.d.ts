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

interface Props_MeeIndexedDBTable_Options_Defined<T> {
  name: string;
  primary: keyof T | "id" | "rowid" | "key";
  secondary?: Array<keyof T>;
}

interface Props_MeeIndexedDBTable_Options<T> extends Props_MeeIndexedDBTable_Options_Defined<T> {
  primary?: keyof T | "id" | "rowid" | "key";
}

interface Props_MeeIndexedDBTable_Options_WithArg<T> extends Props_MeeIndexedDBTable_Options<T> {
  defaultBusy?: boolean;
}

interface Props_IndexedDataClass_DataStore<T = any> {
  data: T;
  store?: IDBObjectStore;
}

interface Props_IndexedDataClass_Save<T = any> extends Props_IndexedDataClass_DataStore<any[]> {
  callback?(item: T, index?: number): any | Promise<any>;
}

interface Props_Indexed_KV_Save<T = any> extends Props_IndexedDataClass_DataStore<Map<string, T> | Array<[string, T]>> { }

interface Props_IndexedDataClass_NoCallback_Save<T = any> extends Props_IndexedDataClass_DataStore<T[]> { }


interface Props_MeeIndexedDB_Request_Base {
  transaction?: IDBTransaction | null;
  store?: IDBObjectStore;
}

interface Props_MeeIndexedDB_Query extends Props_MeeIndexedDB_Request_Base {
  query: IDBValidKey | IDBKeyRange;
}

interface Props_MeeIndexedDB_Key<T> extends Props_MeeIndexedDB_Query {
  index?: keyof T;
}

interface Props_MeeIndexedDB_Request_GetAll<T = any> extends Props_MeeIndexedDB_Request_Base {
  query?: IDBValidKey | IDBKeyRange | null;
  count?: number;
  index?: keyof T;
}

interface Props_MeeIndexedDB_Find<T>
  extends Props_MeeIndexedDB_Request_Base, findMeeProps<T> {
  callback?: (value: T) => boolean;
}

interface Props_MeeIndexedDB_Value extends Props_MeeIndexedDB_Request_Base {
  value: any;
}
