interface dataBaseType<T = unknown> {
  key?: string;
  lastmod?: string;
  version?: string;
  data?: T[];
}

interface importEntryDataType<T = unknown> extends dataBaseType<T> {
  overwrite?: boolean;
}

type LoadAtomType = boolean | CacheParamType;
