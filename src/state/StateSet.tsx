import { Toaster } from "react-hot-toast";
import { SoundPlayer } from "./SoundPlayer";
import { ImageViewer } from "./ImageViewer";
import { SoundState, useSoundState } from "./SoundState";
import { ImageState, useImageState } from "./ImageState";
import { EmbedState } from "./Embed";
import { CharaState, useCharaState } from "./CharaState";
import { useCallback, useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { ThemeState } from "./ThemeSetter";
import { FeedState, useFeedState } from "./FeedRead";

export function StateSet() {
  return (
    <>
      <SoundPlayer />
      <ImageViewer />
      <Toaster />
      <DataState />
      <ThemeState />
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
      <SoundState />
      <ImageState />
      <CharaState />
      <FeedState />
    </>
  );
}

const loadingCheckID = "Element_DateState_Loading_NotEnd";
const reloadFunction =
  process.env.NODE_ENV === "development"
    ? `setTimeout(() => {if (document.getElementById("${loadingCheckID}")) location.reload()}, 5000)`
    : "";

type DataStateType = {
  isComplete: boolean;
  setComplete: (value: boolean) => void;
};

export const useAccessCounter = create<{
  current: number;
  month: number;
  total: number;
  date: Date;
}>(() => {
  const v = { current: 0, month: 0, total: 0, date: new Date() };
  const data = document.getElementById("accessCountData");
  if (data) {
    v.current = Number(data.dataset.current);
    v.month = Number(data.dataset.month);
    v.total = Number(data.dataset.total);
  }
  return v;
});

export const useDataState = create<DataStateType>((set) => ({
  isComplete: false,
  setComplete: (value) => {
    set(() => ({ isComplete: value }));
  },
}));

export function DataState() {
  const stateList = [
    useCharaState(),
    useImageState(),
    useSoundState(),
    useFeedState(),
  ];
  const { isComplete, setComplete } = useDataState(
    ({ isComplete, setComplete }) => ({ isComplete, setComplete })
  );
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
