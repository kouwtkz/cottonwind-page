import {
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
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import { ExternalStoreProps } from "~/data/IndexedDB/IndexedDataLastmodMH";

interface FilesState {
  files?: FilesRecordType[];
  filesMap?: Map<string, FilesRecordType>;
  filesData?: MeeIndexedDBTable<FilesRecordType>;
}
export const useFiles = CreateObjectState<FilesState>();

export default function FileState() {
  const { Set } = useFiles();
  const env = useEnv()[0];
  const filesData = useSyncExternalStore(
    ...ExternalStoreProps(filesDataIndexed)
  );
  useEffect(() => {
    if (filesData?.db && env) {
      const filesMap = new Map<string, FilesRecordType>();
      filesData.getAll().then((items) => {
        items.forEach((v) => {
          if (!v.src) return;
          const item: FilesRecordType = {
            ...v,
            private:
              typeof v.private === "number" ? Boolean(v.private) : undefined,
            mtime: v.mtime ? new Date(v.mtime) : undefined,
            lastmod: v.lastmod ? new Date(v.lastmod) : undefined,
          };
          const key = item.key;
          if (!filesMap.has(key)) {
            filesMap.set(key, item);
          }
        });
        Set({ filesData, filesMap, files: Array.from(filesMap.values()) });
      });
    }
  }, [filesData, env]);
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
        const file = filesMap?.get(embed);
        if (file) {
          const url = concatOriginUrl(mediaOrigin, file.src);
          fetch(url)
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
      <MultiParserWithMedia only={{ toDom: true }}>
        {element}
      </MultiParserWithMedia>
    </div>
  ) : (
    <></>
  );
}
