import { useEffect, useRef } from "react";
import axios from "axios";
import { CreateObjectState } from "@src/state/CreateState";

type dataType = { [k: string]: string };

type MarkdownDataStateType = {
  data: dataType | null;
  setData: (value: dataType) => void;
  isSet: boolean;
};

export const useMarkdownDataState = CreateObjectState<MarkdownDataStateType>(
  (set) => ({
    data: null,
    setData: (value) => {
      set({ data: value, isSet: true });
    },
    isSet: false,
  })
);

export default function MarkdownDataState({ url }: { url: string }) {
  const { setData } = useMarkdownDataState();
  const isSet = useRef(false);
  useEffect(() => {
    if (!isSet.current) {
      axios(url).then((r) => {
        const data: dataType = r.data;
        setData(data);
      });
      isSet.current = true;
    }
  });
  return <></>;
}
