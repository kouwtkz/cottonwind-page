import { Toaster } from "react-hot-toast";
import { SoundPlayer } from "./SoundPlayer";
import { ImageViewer } from "./ImageViewer";
import { ImageState, useImageState } from "./ImageState";
import { EmbedState } from "./Embed";
import { useEffect, useMemo, useRef } from "react";
import { create } from "zustand";
import { ThemeStateClass } from "./ThemeSetter";
import { FeedState, useFeedState } from "@/state/FeedState";
import { useCookies } from "react-cookie";
import { atom, useAtom } from "jotai";

export const ThemeState = new ThemeStateClass("theme", [
  "theme-orange",
  "theme-aqua",
]);
export const DarkThemeState = new ThemeStateClass("darktheme", [
  "dark",
  "auto",
]);

export function StateSet() {
  return (
    <>
      <SoundPlayer />
      <ImageViewer />
      <Toaster />
      <DataState />
      <ManageState />
      {ThemeState.State()}
      {DarkThemeState.State()}
      {import.meta.env.DEV ? (
        <>
          <EmbedState />
        </>
      ) : null}
    </>
  );
}

function DataStateSet() {
  return (
    <>
      {/* <ImageState /> */}
      <ImageState />
      <FeedState />
    </>
  );
}

const loadingCheckID = "Element_DateState_Loading_NotEnd";
const reloadFunction =
  process.env.NODE_ENV === "development"
    ? `setTimeout(() => {if (document.getElementById("${loadingCheckID}")) location.reload()}, 5000)`
    : "";

export const siteIsFirstAtom = atom(true);
export const dataIsCompleteAtom = atom(false);
export const pageIsCompleteAtom = atom(true);

function DataState() {
  const fScrollY = useRef(window.scrollY);
  const [isFirst, setIsFirst] = useAtom(siteIsFirstAtom);
  const [dataIsComplete, setIsComplete] = useAtom(dataIsCompleteAtom);
  const [pageIsComplete, setPageIsComplete] = useAtom(pageIsCompleteAtom);
  const isComplete = useMemo(
    () => dataIsComplete && pageIsComplete,
    [dataIsComplete, pageIsComplete]
  );
  const isCompleteRef = useRef(false);
  const isSetList = [useFeedState().isSet, useImageState().imageObject.isSet];
  const comp = useMemo(() => isSetList.every((v) => v), [isSetList]);
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
      <DataStateSet />
    </>
  );
}

type ManageStateType = {
  isLogin: boolean;
  setIsLogin: (value: boolean) => void;
  visibleWorkers: boolean;
  setVisibleWorkers: (value: boolean) => void;
};
export const useManageState = create<ManageStateType>((set) => ({
  isLogin: false,
  setIsLogin: (value) => {
    set(() => ({ isLogin: value }));
  },
  visibleWorkers: false,
  setVisibleWorkers: (value) => {
    set(() => ({ visibleWorkers: value }));
  },
}));

function ManageState() {
  const { isLogin, setIsLogin, setVisibleWorkers } = useManageState();
  const [cookies] = useCookies();
  useEffect(() => {
    const serverData = document.getElementById("server-data");
    setIsLogin(serverData?.dataset.isLogin === "true");
  }, [setIsLogin]);
  useEffect(() => {
    if (isLogin) setVisibleWorkers("VisibleWorkers" in cookies);
  }, [isLogin, cookies]);
  return <></>;
}
