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
