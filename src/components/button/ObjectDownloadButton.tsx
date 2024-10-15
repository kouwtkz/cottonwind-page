import { StorageDataStateClass } from "@/functions/storage/StorageDataStateClass";
import { HTMLAttributes, ReactNode, Ref } from "react";
import { MdFileDownload } from "react-icons/md";
import { fileDownload } from "../FileTool";

interface DownloadDataObjectOptions<K> {
  id?: K;
  key?: K | K[];
  time?: K;
}
export function DownloadDataObject<T extends object>(
  dataObject: StorageDataStateClass<T>,
  options: DownloadDataObjectOptions<keyof T | null> = {}
) {
  const {
    id = "id",
    key = "key",
    time = "time",
  } = options as DownloadDataObjectOptions<string | null>;
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
  const object = {
    ...dataObject.storage,
    data,
  };
  fileDownload(dataObject.storage.key + ".json", JSON.stringify(object));
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
interface ObjectDownloadButtonProps<T extends object>
  extends BaseObjectButtonProps {
  dataObject: StorageDataStateClass<T>;
  options?: DownloadDataObjectOptions<keyof T | null>;
}
export function ObjectDownloadButton<T extends object>({
  beforeConfirm = true,
  icon = <MdFileDownload />,
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
