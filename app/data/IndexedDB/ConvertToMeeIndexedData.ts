import { MeeIndexedDB, MeeIndexedDBTable } from "./MeeIndexedDB";

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
  const item: any = v;
  item.rawdata = { ...v };
  convert.date?.forEach(key => {
    if (typeof v[key] === "string") {
      item[key] = new Date(v[key]);
    }
  })
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

interface Props_importfromStorageData<T, D = T> extends Omit<Props_SaveConvertMeeIndexedFromData<T, D>, "data"> { }
export function importfromStorageData<T, D = T>(props: Props_importfromStorageData<T, D>) {
  const storageString = localStorage.getItem(props.table.options.name);
  if (storageString) {
    const storageJson = JSON.parse(storageString) as Props_StorageDataState_JSON<T[]>;
    if (storageJson) return saveConvertMeeIndexedFromData({ ...props, data: storageJson.data });
  }
}
