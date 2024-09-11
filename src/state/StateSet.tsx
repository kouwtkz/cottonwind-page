import { Toaster } from "react-hot-toast";
import { SoundPlayer } from "./SoundPlayer";
import { ImageViewer } from "./ImageViewer";
import { ImageState } from "./ImageState";
import { EmbedState } from "./Embed";
import { ThemeStateClass } from "./ThemeSetter";
import { FeedState, outFeedAtom } from "./FeedState";
import { EnvAtom, EnvState } from "./EnvState";
import { atom, useAtom } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import { charactersDataAtom, DataState, imagesDataAtom } from "./DataState";
import { CharacterState } from "./CharacterState";
import PostState from "./PostState";

export const siteIsFirstAtom = atom(true);
export const dataIsCompleteAtom = atom(false);
export const pageIsCompleteAtom = atom(true);

export const ThemeState = new ThemeStateClass("theme", [
  "theme-orange",
  "theme-aqua",
]);
export const DarkThemeState = new ThemeStateClass("darktheme", [
  "dark",
  "auto",
]);

export function StateSet() {
  console.log("test")
  const isSetList = [
    true
    // Boolean(useAtom(imagesDataAtom)[0]),
    // Boolean(useAtom(charactersDataAtom)[0]),
    // Boolean(useAtom(EnvAtom)[0]),
    // Boolean(useAtom(outFeedAtom)[0]),
  ];
  return (
    <>
      <EnvState />
      <DataState />
      <SoundPlayer />
      <ImageViewer />
      <Toaster />
      <PostState />
      <LoadingState isSetList={isSetList}>
        <ImageState />
        <CharacterState />
        <FeedState />
      </LoadingState>
      {ThemeState.State()}
      {DarkThemeState.State()}
      {import.meta.env?.DEV ? (
        <>
          <EmbedState />
        </>
      ) : null}
    </>
  );
}

const loadingCheckID = "Element_DateState_Loading_NotEnd";
const reloadFunction =
  process.env.NODE_ENV === "development"
    ? `setTimeout(() => {if (document.getElementById("${loadingCheckID}")) location.reload()}, 5000)`
    : "";

interface LoadingStateProps {
  children?: React.ReactNode;
  isSetList?: boolean[];
}
function LoadingState({ isSetList, children }: LoadingStateProps) {
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
