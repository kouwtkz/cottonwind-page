import React, {
  type HTMLAttributes,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { useEnv } from "~/components/state/EnvState";
import { filesDataIndexed, mediaOrigin } from "~/data/ClientDBLoader";
import { CreateObjectState, CreateState } from "./CreateState";
import { MultiParserWithMedia } from "~/components/parse/MultiParserWithMedia";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { type MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import { ExternalStoreProps } from "~/data/IndexedDB/IndexedDataLastmodMH";
import { customFetch } from "../functions/fetch";

type IdbTableType = MeeIndexedDBTable<FilesRecordType>;
interface FilesState {
  files?: FilesRecordType[];
  filesMap?: Map<string, FilesRecordType>;
  idbTable?: IdbTableType;
}
export const useFiles = CreateObjectState<FilesState>();

export default function FileState() {
  const { Set } = useFiles();
  const env = useEnv()[0];
  const data = useSyncExternalStore(...ExternalStoreProps(filesDataIndexed));
  useEffect(() => {
    if (data?.db && env) {
      const filesMap = new Map<string, FilesRecordType>();
      data.getAll().then((items) => {
        items.forEach((v) => {
          if (!v.src) return;
          const item: FilesRecordType = {
            ...v,
            mtime: v.mtime ? new Date(v.mtime) : undefined,
            lastmod: v.lastmod ? new Date(v.lastmod) : undefined,
            dir: v.src.replace(/\/?[^\/]+$/, "").replace(/^\/+/, ""),
          };
          const key = item.key;
          if (!filesMap.has(key)) {
            filesMap.set(key, item);
          }
        });
        Set({ idbTable: data, filesMap, files: Array.from(filesMap.values()) });
      });
    }
  }, [data, env, Set]);
  return <></>;
}

interface EmbedNodeProps extends HTMLAttributes<HTMLDivElement> {
  embed?: string;
}

export function EmbedNode({ embed, ...args }: EmbedNodeProps) {
  const [element, setElement] = useState<string>();
  const { filesMap } = useFiles();
  useEffect(() => {
    if (embed && mediaOrigin) {
      if (embed.includes("</")) {
        setElement(embed);
      } else {
        let url: string | undefined;
        if (/^https?:\/\//.test(embed)) {
          url = embed;
        } else {
          const file = filesMap?.get(embed);
          if (file) url = concatOriginUrl(mediaOrigin, file.src);
        }
        if (url) {
          customFetch(url, { cors: true })
            .then((r) => r.text())
            .then((data) => {
              setElement(data);
            })
            .catch((e) => {
              console.log(e);
            });
        }
      }
    }
  }, [embed, mediaOrigin]);
  return element ? (
    <div {...args}>
      <MultiParserWithMedia>{element}</MultiParserWithMedia>
    </div>
  ) : (
    <></>
  );
}
