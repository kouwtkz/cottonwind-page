import { useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { useLocation } from "react-router-dom";
import { dataIsCompleteAtom, pageIsCompleteAtom } from "@/state/DataState";
import hljs from "highlight.js";

export function codeToHighlight(selector = "code") {
  (document.querySelectorAll(selector) as NodeListOf<HTMLElement>).forEach(
    (el) => {
      hljs.highlightElement(el);
    }
  );
}

export function CodeCheck() {
  const location = useLocation();
  const [dataIsComplete] = useAtom(dataIsCompleteAtom);
  const [pageIsComplete] = useAtom(pageIsCompleteAtom);
  const isComplete = useMemo(
    () => dataIsComplete && pageIsComplete,
    [dataIsComplete, pageIsComplete]
  );
  useEffect(() => {
    if (isComplete) codeToHighlight();
  }, [location, isComplete]);
  return <></>;
}
