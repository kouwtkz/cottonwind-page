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

interface JsonFromDataObjectOptionFields<K> {
  id?: K | null;
  key?: K | Array<K> | null;
  time?: K | null;
}
interface JsonFromDataObjectOptions<T> {
  data: Array<T>;
  key: string;
  version?: string | number;
  lastmod?: string | Date;
  fields?: JsonFromDataObjectOptionFields<keyof T>;
}

interface DataConvertListType<T> {
  date?: Array<keyof T>;
  boolean?: Array<keyof T>;
  array?: Array<keyof T>;
}

interface WithRawDataType<D> {
  rawdata?: D;
}