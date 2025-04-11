interface Props_LastmodMHClass<T, D = T, TABLE_CLASS> {
  options: Props_LastmodMHClass_Options<T, D>;
  table?: TABLE_CLASS;
}

type Type_LastmodMH_Event = Type_MeeIndexedDB_Event | "load";

interface Props_LastmodMHClass_Options<T, D = T> extends Props_LastmodMH_TableVersion, Props_MeeIndexedDBTable_Options<T> {
  src: string;
  preLoad?: LoadStateType;
  isLogin?: LoadStateType;
  latestField?: { [k in keyof T]?: OrderByType };
  lastmodField?: string;
  scheduleEnable?: boolean;
  jsonFromDataOptions?: JsonFromDataObjectOptionFields<keyof D>;
  convert?: DataConvertListType<D>;
}

interface Props_LastmodMH_SetSearchParamsOption<T> {
  searchParams: URLSearchParams;
  loadValue?: LoadStateType;
  prefix?: string;
}
interface Props_LastmodMH_FetchData<T>
  extends Omit<Props_LastmodMH_SetSearchParamsOption<T>, "searchParams"> {
  src?: string;
  apiOrigin?: string;
}

interface Props_LastmodMH_Tables_Data {
  key: string;
  version: string;
  lastmod: string;
}
interface Props_LastmodMH_Tables extends Props_LastmodMH_Tables_Data, WithRawDataType<Props_LastmodMH_Tables_Data> {
  lastmod: Date;
}

interface Props_LastmodMH_TableVersion extends Omit<Props_LastmodMH_Tables_Data, "lastmod" | "key"> {
  name: string;
  oldServerKeys?: string[];
  oldClientKeys?: string[];
  newVersion?: string;
}

interface Props_StorageDataState_JSON<T extends Object> {
  lastmod: string;
  version: string;
  data: T;
}
