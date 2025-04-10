interface DataClassTableSetSearchParamsOptionProps<T> {
  searchParams: URLSearchParams;
  loadValue?: LoadStateType;
  prefix?: string;
}
interface DataClassTableFetchDataProps<T>
  extends Omit<DataClassTableSetSearchParamsOptionProps<T>, "searchParams"> {
  src?: string;
  apiOrigin?: string;
}

interface DataClassTableVersionProps {
  key: string;
  version: string;
  oldServerKeys?: string[];
  oldClientKeys?: string[];
  newVersion?: string;
}

interface DataClassProps<T, D = T> extends DataClassTableVersionProps {
  src: string;
  primary?: keyof T | "id" | "rowid";
  secondary?: Array<keyof T>;
  preLoad?: LoadStateType;
  isLogin?: LoadStateType;
  latestField?: { [k in keyof T]?: OrderByType };
  lastmodField?: string;
  scheduleEnable?: boolean;
  jsonFromDataOptions?: JsonFromDataObjectOptionFields<keyof D>;
  convert?: DataConvertListType<D>;
}

interface StorageDataStateJSONProps<T extends Object> {
  lastmod: string;
  version: string;
  data: T;
}

interface TableVersionEntryType extends DataClassTableVersionProps, WithRawDataType<DataClassTableVersionProps> {
  lastmod: Date;
}

interface TableVersionEntryDataType extends TableVersionEntryType {
  lastmod: string;
}
