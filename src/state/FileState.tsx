import { HTMLAttributes, useEffect, useState } from "react";
import { useEnv, useMediaOrigin } from "@/state/EnvState";
import { filesDataObject } from "./DataState";
import { CreateState } from "./CreateState";
import { MultiParserWithMedia } from "@/components/parse/MultiParserWithMedia";
import { concatOriginUrl } from "@/functions/originUrl";

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
      setFilesMap(filesMap);
      setFiles(Object.values(Object.fromEntries(filesMap)));
    }
  }, [postsData, env, setFiles, setFilesMap]);
  return <></>;
}

interface EmbedNodeProps extends HTMLAttributes<HTMLDivElement> {
  embed?: string;
}

export function EmbedNode({ embed, ...args }: EmbedNodeProps) {
  const [element, setElement] = useState<string>();
  const mediaOrigin = useMediaOrigin()[0];
  const filesMap = useFilesMap()[0];
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
