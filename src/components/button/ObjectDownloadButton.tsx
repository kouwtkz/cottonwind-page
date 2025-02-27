import { StorageDataStateClass } from "@/functions/storage/StorageDataStateClass";
import { HTMLAttributes, ReactNode, Ref } from "react";
import { fileDownload } from "../FileTool";
import { RiDownloadFill } from "react-icons/ri";

export function JsonFromDataObject<T extends object>(
  dataObject: StorageDataStateClass<T>,
  options: JsonFromDataObjectOptions<keyof T | null> = {}
) {
  const {
    id = "id",
    key = "key",
    time = "time",
  } = {
    ...options,
    ...dataObject.options.jsonFromDataOptions,
  } as JsonFromDataObjectOptions<string | null>;
  let data = (dataObject.storage.data?.concat() || []) as any[];
  if (key) {
    const keys = Array.isArray(key) ? key : [key];
    data = data.filter((v) => keys.some((key) => key && v[key]));
  }
  if (id) {
    data = data.map(({ [id]: _id, ...v }) => {
      return v;
    });
  }
  if (time)
    data.sort((a, b) => (a[time] > b[time] ? 1 : a[time] < b[time] ? -1 : 0));
  return { ...dataObject.storage, data };
}
export function DownloadDataObject<T extends object>(
  dataObject: StorageDataStateClass<T>,
  {
    name,
    ...options
  }: JsonFromDataObjectOptions<keyof T | null> & { name?: string } = {}
) {
  fileDownload(
    (name || dataObject.storage.key) + ".json",
    JSON.stringify(JsonFromDataObject(dataObject, options))
  );
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
}
export interface ImportObjectButtonProps<E = HTMLButtonElement>
  extends BaseObjectButtonProps<E> {
  overwrite?: boolean;
}
interface ObjectDownloadButtonProps<T extends object>
  extends BaseObjectButtonProps {
  dataObject: StorageDataStateClass<T>;
  options?: JsonFromDataObjectOptions<keyof T | null>;
}
export function ObjectDownloadButton<T extends object>({
  beforeConfirm = true,
  icon = <RiDownloadFill />,
  iconClass,
  children,
  customRef,
  dataObject,
  options,
  ...props
}: ObjectDownloadButtonProps<T>) {
  return (
    <button
      type="button"
      title="ダウンロードする"
      {...props}
      ref={customRef}
      onClick={async () => {
        if (Confirm("JSONデータをダウンロードしますか？", beforeConfirm)) {
          DownloadDataObject(dataObject, options);
        }
      }}
    >
      {icon ? <span className={iconClass}>{icon}</span> : null}
      {children ? <span className="text-bottom">{children}</span> : null}
    </button>
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
