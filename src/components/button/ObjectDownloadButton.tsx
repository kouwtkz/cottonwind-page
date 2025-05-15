import { HTMLAttributes, ReactNode, Ref } from "react";
import { fileDownload } from "../FileTool";
import { RiDownloadFill } from "react-icons/ri";
import { IndexedDataLastmodMH } from "@/data/IndexedDB/IndexedDataLastmodMH";
import { MeeIndexedDBTable } from "@/data/IndexedDB/MeeIndexedDB";

export function JsonFromDataObject<T>({
  data: TData,
  key,
  lastmod,
  version,
  fields = {},
}: JsonFromDataObjectOptions<T>) {
  const body = {} as any;
  if (key) body.key = key;
  if (lastmod)
    body.lastmod =
      typeof lastmod === "object" ? lastmod.toISOString() : lastmod;
  if (version) body.version = version.toString();
  let data = TData as any[];
  const {
    id: fieldsId = "id",
    key: fieldsKey = "key",
    time: fieldsTime = "time",
  } = fields;
  if (fieldsKey) {
    const keys = Array.isArray(fieldsKey) ? fieldsKey : [fieldsKey];
    data = data.filter((v) => keys.some((key) => key && v[key]));
  }
  if (fieldsId) {
    data = data.map(({ [fieldsId]: _id, ...v }) => {
      return v;
    });
  }
  if (fieldsTime)
    data.sort((a, b) =>
      a[fieldsTime] > b[fieldsTime] ? 1 : a[fieldsTime] < b[fieldsTime] ? -1 : 0
    );
  body.data = data;
  return body;
}
interface DownloadDataObjectProps<T> extends JsonFromDataObjectOptions<T> {
  name?: string;
}
export function DownloadDataObject<T>({
  name,
  ...props
}: DownloadDataObjectProps<T>) {
  fileDownload(
    (name || props.key.toString()) + ".json",
    JSON.stringify(JsonFromDataObject(props))
  );
}

export async function getIndexedDBJsonOptions<T extends WithRawDataType<any>>(
  indexedDB: IndexedDataLastmodMH<T, any, MeeIndexedDBTable<T>>
) {
  const data = (await indexedDB.table.getAll()).map((v) =>
    v.rawdata ? v.rawdata : v
  );
  return {
    data,
    key: indexedDB.key,
    lastmod: indexedDB.beforeLastmod,
    version: indexedDB.version,
  } as JsonFromDataObjectOptions<any>;
}
export function DownloadIndexedDBObject<T extends WithRawDataType<any>>({
  indexedDB,
  name,
}: {
  name?: string;
  indexedDB: IndexedDataLastmodMH<T, any, MeeIndexedDBTable<T>>;
}) {
  getIndexedDBJsonOptions(indexedDB).then((data) => {
    DownloadDataObject({ ...data, name });
  });
}

function Confirm(defaultMessage: string, beforeConfirm?: string | boolean) {
  return (
    !beforeConfirm ||
    confirm(typeof beforeConfirm === "string" ? beforeConfirm : defaultMessage)
  );
}

export interface BaseObjectButtonProps<E = HTMLButtonElement>
  extends HTMLAttributes<E> {
  icon?: ReactNode;
  iconClass?: string;
  customRef?: Ref<E>;
  beforeConfirm?: string | boolean;
  disabled?: boolean;
}
export interface ImportObjectButtonProps<E = HTMLButtonElement>
  extends BaseObjectButtonProps<E> {
  overwrite?: boolean;
}
interface ObjectDownloadButtonProps<T> extends BaseObjectButtonProps {
  options?: JsonFromDataObjectOptions<T>;
  onClick?: () => Promise<JsonFromDataObjectOptions<T> | void>;
}
export function ObjectDownloadButton<T extends WithRawDataType<any>>({
  beforeConfirm = true,
  icon = <RiDownloadFill />,
  iconClass,
  children,
  customRef,
  options,
  onClick,
  ...props
}: ObjectDownloadButtonProps<T>) {
  return (
    <button
      type="button"
      title="ダウンロードする"
      {...props}
      ref={customRef}
      onClick={async () => {
        if (
          (options || onClick) &&
          Confirm("JSONデータをダウンロードしますか？", beforeConfirm)
        ) {
          if (options) {
            DownloadDataObject(options);
          } else if (onClick) {
            onClick().then((options) => {
              if (options) DownloadDataObject(options);
            });
          }
        }
      }}
    >
      {icon ? <span className={iconClass}>{icon}</span> : null}
      {children ? <span className="text-bottom">{children}</span> : null}
    </button>
  );
}

interface ObjectIndexedDBDownloadButtonProps<T>
  extends Omit<ObjectDownloadButtonProps<T>, "onClick" | "options"> {
  indexedDB?: IndexedDataLastmodMH<T, any, MeeIndexedDBTable<T>>;
}
export function ObjectIndexedDBDownloadButton<T extends WithRawDataType<any>>({
  indexedDB,
  ...props
}: ObjectIndexedDBDownloadButtonProps<T>) {
  return (
    <ObjectDownloadButton
      {...props}
      onClick={async () => {
        if (indexedDB) return getIndexedDBJsonOptions(indexedDB);
      }}
    />
  );
}

export function ObjectCommonButton({
  children,
  icon,
  iconClass,
  customRef,
  beforeConfirm,
  onClick,
  ...props
}: BaseObjectButtonProps) {
  return (
    <button
      type="button"
      {...props}
      ref={customRef}
      onClick={(e) => {
        if (onClick && Confirm("本当に実行しますか？", beforeConfirm)) {
          onClick(e);
        }
      }}
    >
      {icon ? <span className={iconClass}>{icon}</span> : null}
      {children ? <span className="text-bottom">{children}</span> : null}
    </button>
  );
}
