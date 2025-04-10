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

interface Props_MeeIndexedDBTable<T, T = D> {
  db?: IDBDatabase;
  tableName: string;
  options: DataClassProps<T, D>
}

interface Props_MeeIndexedDBTable_Constructor<T>
  extends Omit<Props_MeeIndexedDBTable<T>, "tableName"> {
  tableName?: string;
}