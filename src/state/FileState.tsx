import { useEffect } from "react";
import { useEnv } from "@/state/EnvState";
import { filesDataObject } from "./DataState";
import { CreateState } from "./CreateState";

export const useFiles = CreateState<FilesRecordType[]>();
export const useFilesMap = CreateState<Map<string, FilesRecordType>>();

export default function FileState() {
  const postsData = filesDataObject.useData()[0];
  const setFiles = useFiles()[1];
  const setFilesMap = useFilesMap()[1];
  const env = useEnv()[0];
  useEffect(() => {
    if (postsData && env) {
      const filesMap = new Map<string, FilesRecordType>();
      postsData.forEach((v) => {
        if (!v.src) return;
        const item: FilesRecordType = {
          ...v,
          private: typeof v.private === "number" ? Boolean(v.private) : undefined,
          mtime: v.mtime ? new Date(v.mtime) : undefined,
          lastmod: v.lastmod ? new Date(v.lastmod) : undefined,
        };
        const key = item.key;
        if (!filesMap.has(key)) {
          filesMap.set(key, item);
        }
      });
      setFilesMap(filesMap);
      setFiles(Object.values(Object.fromEntries(filesMap)));
    }
  }, [postsData, env, setFiles, setFilesMap]);
  return <></>;
}
