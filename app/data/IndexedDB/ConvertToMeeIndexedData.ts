import { StrToInstant } from "~/components/functions/time/TemporalFunction";
import { MeeIndexedDB, MeeIndexedDBTable } from "./MeeIndexedDB";
import { siteTimeZone } from "~/components/functions/time/DateFunction";

interface Props_SaveConvertMeeIndexedFromData<T, D = T> {
  data: T[];
  table: MeeIndexedDBTable<T>;
  convert?: DataConvertListType<D>
  store?: IDBObjectStore;
}
export async function saveConvertMeeIndexedFromData<T, D = T>({ data, table, convert, store }: Props_SaveConvertMeeIndexedFromData<T, D>) {
  return table.usingStore(
    {
      store,
      mode: "readwrite",
      async callback(store) {
        return data.map<Promise<T>>(async (item: any) => {
          if (convert) item = await convertToMeeIndexedData({ item, convert });
          store.put(item);
          return item;
        });
      },
    }
  );
}

interface Props_ConvertToMeeIndexedData<T, D = T> {
  item: D;
  convert: DataConvertListType<D>
}
export async function convertToMeeIndexedData<T, D = T>({ item: v, convert }: Props_ConvertToMeeIndexedData<T, D>) {
  const item: any = { ...v };
  //@ts-ignore
  delete v.extendData;
  item.rawdata = { ...v };
  convert.boolean?.forEach(key => {
    if (typeof v[key] === "number") {
      item[key] = Boolean(v[key]);
    }
  })
  convert.array?.forEach(key => {
    if (typeof v[key] === "string") {
      item[key] = v[key].split(",");
    }
  })
  return item as T & { rawdata: D };
}
export function convertTimeToMeeIndexedData<T>({ item: v, convert }: { item: any; convert?: DataConvertListType<any> }) {
  if (!convert) return v as T;
  const item: any = { ...v };
  convert.date?.forEach(k => {
    if (typeof v[k] === "string") {
      item[k] = (v[k].endsWith("Z") ? Temporal.Instant.from(v[k]) : StrToInstant(v[k])).toZonedDateTimeISO(siteTimeZone);
    }
  })
  return item as T;
}

interface Props_importfromStorageData<T, D = T> extends Omit<Props_SaveConvertMeeIndexedFromData<T, D>, "data"> { }
export function importfromStorageData<T, D = T>(props: Props_importfromStorageData<T, D>) {
  const storageString = localStorage.getItem(props.table.options.name);
  if (storageString) {
    const storageJson = JSON.parse(storageString) as Props_StorageDataState_JSON<T[]>;
    if (storageJson) return saveConvertMeeIndexedFromData({ ...props, data: storageJson.data });
  }
}
