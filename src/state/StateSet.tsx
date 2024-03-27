import { Toaster } from "react-hot-toast";
import SoundPlayer from "./SoundPlayer";
import ImageViewer from "./ImageViewer";
import SoundState, { useSoundState } from "./SoundState";
import ImageState, { useImageState } from "./ImageState";
import { EmbedState } from "./Embed";
import CharaState, { useCharaState } from "./CharaState";
import { useEffect, useLayoutEffect, useRef } from "react";
import { create } from "zustand";
import { ThemeState } from "./ThemeSetter";

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

export const useDataState = create<DataStateType>((set) => ({
  isComplete: false,
  setComplete: (value) => {
    set(() => ({ isComplete: value }));
  },
}));

export function DataState() {
  const stateList = [useCharaState(), useImageState(), useSoundState()];
  const { isComplete, setComplete } = useDataState();
  const first = useRef(true);
  const loading = useRef(true);
  const isFirsIncomplete = useRef(true);
  const doSetComplete = () => {
    if (isFirsIncomplete.current && !isComplete) {
      const comp = stateList.every((v) => v.isSet);
      if (comp) {
        setComplete(true);
        isFirsIncomplete.current = false;
      }
    }
  };
  useEffect(() => {
    doSetComplete();
    if (first.current) {
      setTimeout(() => {
        if (!isComplete) setComplete(true);
      }, 5000);
      first.current = false;
    }
  });
  useLayoutEffect(() => {
    if (loading.current && isComplete) {
      document.body.classList.remove("loading");
      loading.current = false;
    }
  });
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
