import { HTMLAttributes, memo, useEffect, useRef, useState } from "react";
import { create } from "zustand";
import axios from "axios";
import MultiParser from "@/functions/doc/MultiParser";

type EmbedStateType = {
  list: string[];
  isSet: boolean;
  setList: (value: any) => void;
};

export const useEmbedState = create<EmbedStateType>((set) => ({
  list: [],
  isSet: false,
  setList: (value) => {
    set({ list: value, isSet: true });
  },
}));

export function EmbedState() {
  const isSet = useRef(false);
  const { setList } = useEmbedState();
  useEffect(() => {
    if (!isSet.current) {
      axios("/embed/get")
        .then((r) => {
          setList(r.data);
        })
        .catch(() => {
          setList({});
        });
      isSet.current = true;
    }
  });
  return <></>;
}

interface EmbedNodeProps extends HTMLAttributes<HTMLDivElement> {
  embed?: string;
}

export function getEmbedURL(item: string) {
  return item.includes("://") || item.startsWith("/")
    ? item
    : `/static/embed/${item}`;
}

export const EmbedNode = memo(function EmbedNode({
  embed,
  ...args
}: EmbedNodeProps) {
  const [element, setElement] = useState<string>();
  useEffect(() => {
    if (embed) {
      if (embed.includes("</")) {
        setElement(embed);
      } else {
        const url = getEmbedURL(embed);
        axios(url)
          .then(({ data }) => {
            setElement(data);
          })
          .catch((e) => {
            console.log(e);
          });
      }
    }
  }, [embed]);
  return element ? (
    <div {...args}>
      <MultiParser only={{ toDom: true }}>{element}</MultiParser>
    </div>
  ) : (
    <></>
  );
});
