import { ReactNode, useEffect, useMemo, useRef } from "react";
import { atom, useAtom } from "jotai";

const loadingCheckID = "Element_DateState_Loading_NotEnd";
const reloadFunction =
  process.env.NODE_ENV === "development"
    ? `setTimeout(() => {if (document.getElementById("${loadingCheckID}")) location.reload()}, 5000)`
    : "";

export const siteIsFirstAtom = atom(true);
export const dataIsCompleteAtom = atom(false);
export const pageIsCompleteAtom = atom(true);

interface DataStateProps {
  children?: ReactNode;
  isSetList?: boolean[];
}
export function DataState({ isSetList, children }: DataStateProps) {
  const fScrollY = useRef(window.scrollY);
  const [isFirst, setIsFirst] = useAtom(siteIsFirstAtom);
  const [dataIsComplete, setIsComplete] = useAtom(dataIsCompleteAtom);
  const [pageIsComplete, setPageIsComplete] = useAtom(pageIsCompleteAtom);
  const isComplete = useMemo(
    () => dataIsComplete && pageIsComplete,
    [dataIsComplete, pageIsComplete]
  );
  const isCompleteRef = useRef(false);
  const comp = useMemo(
    () => (isSetList ?? [true]).every((v) => v),
    [isSetList]
  );
  useEffect(() => {
    if (comp !== dataIsComplete) setIsComplete(comp);
  }, [comp, dataIsComplete]);
  useEffect(() => {
    isCompleteRef.current = isComplete;
  }, [isComplete]);
  useEffect(() => {
    document.body.classList.remove("dummy");
    setTimeout(() => {
      if (!isCompleteRef.current) {
        setIsComplete(true);
        setPageIsComplete(true);
      }
    }, 5000);
  }, []);
  useEffect(() => {
    if (isComplete) {
      document.body.classList.remove("loading");
    } else {
      document.body.classList.add("loading");
    }
  }, [isComplete]);
  useEffect(() => {
    if (isFirst && isComplete) {
      scrollTo({ top: fScrollY.current });
      setIsFirst(false);
    }
  }, [isComplete, isFirst]);
  return (
    <>
      {isComplete ? null : isFirst && reloadFunction ? (
        <>
          <script dangerouslySetInnerHTML={{ __html: reloadFunction }} />
          <div id={loadingCheckID} />
        </>
      ) : null}
      {children}
    </>
  );
}
