interface dataBaseType<T = unknown> {
  key?: string;
  lastmod?: string;
  version?: string;
  data?: T[];
}

interface importEntryDataType<T = unknown> extends dataBaseType<T> {
  overwrite?: boolean;
  first?: boolean;
  deleteBucket?: boolean;
}

type LoadStateType = boolean | CacheParamType;

interface JsonFromDataObjectOptions<K> {
  id?: K | null;
  key?: K | K[] | null;
  time?: K | null;
}

interface TableVersionProps {
  key: string;
  version: string;
  oldServerKeys?: string[];
  oldClientKeys?: string[];
  newVersion?: string;
}

interface StorageDataStateClassProps<T> extends TableVersionProps {
  src: string;
  idField?: keyof T | "id" | "rowid";
  preLoad?: LoadStateType;
  isLogin?: LoadStateType;
  latestField?: { [k in keyof T]?: OrderByType };
  lastmodField?: string;
  scheduleEnable?: boolean;
  jsonFromDataOptions?: JsonFromDataObjectOptions<keyof T>;
}

interface TableVersionEntryType extends TableVersionProps {
  lastmod: string;
}
