import { useEffect, useRef } from "react";
import { CreateObjectState } from "~/components/state/CreateState";

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
      fetch(url)
        .then<dataType>((r) => r.json())
        .then((data) => {
          setData(data);
        });
      isSet.current = true;
    }
  });
  return <></>;
}
