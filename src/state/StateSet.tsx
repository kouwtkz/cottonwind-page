import { Toaster } from "react-hot-toast";
import { SoundPlayer } from "./SoundPlayer";
import { ImageViewer } from "./ImageViewer";
import { ImageState, useImageState } from "./ImageState";
import { EmbedState } from "./Embed";
import { useCallback, useEffect, useRef, useState } from "react";
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

export const dataIsCompleteAtom = atom(false);

function DataState() {
  const stateList = [useFeedState(), useImageState().imageObject];
  const [isComplete, setComplete] = useAtom(dataIsCompleteAtom);
  const first = useRef(true);
  const loading = useRef(true);
  const isFirsIncomplete = useRef(true);
  const [fScrollY] = useState(window.scrollY);
  const doSetComplete = useCallback(() => {
    if (isFirsIncomplete.current && !isComplete) {
      const comp = stateList.every((v) => v.isSet);
      if (comp) {
        setComplete(true);
        isFirsIncomplete.current = false;
      }
    }
  }, [isComplete, fScrollY, stateList]);
  useEffect(() => {
    doSetComplete();
    if (first.current) {
      document.body.classList.remove("dummy");
      setTimeout(() => {
        if (isFirsIncomplete.current && !isComplete) setComplete(true);
      }, 5000);
      first.current = false;
    }
  });
  useEffect(() => {
    if (loading.current && isComplete) {
      scrollTo({ top: fScrollY });
      document.body.classList.remove("loading");
      loading.current = false;
    }
  }, [fScrollY, isComplete]);
  return (
    <>
      {isComplete ? null : first.current && reloadFunction ? (
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
