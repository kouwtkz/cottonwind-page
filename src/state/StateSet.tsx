import { Toaster } from "react-hot-toast";
import { SoundPlayer } from "./SoundPlayer";
import { ImageViewer } from "./ImageViewer";
import { ImageState, useImageState } from "./ImageState";
import { EmbedState } from "./Embed";
import { ThemeStateClass } from "./ThemeSetter";
import { useEnv, EnvState, useIsLogin } from "./EnvState";
import { atom, useAtom } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import { DataState } from "./DataState";
import { useCharacters, CharacterState } from "./CharacterState";
import PostState, { usePosts } from "./PostState";
import { SoundState, useSounds } from "./SoundState";
import { CreateState } from "./CreateState";

export const useSiteIsFirst = CreateState(true);
export const useDataIsComplete = CreateState(false);
export const usePageIsComplete = CreateState(true);

export const ThemeState = new ThemeStateClass("theme", [
  "theme-orange",
  "theme-aqua",
]);
export const DarkThemeState = new ThemeStateClass("darktheme", [
  "dark",
  "auto",
]);

export function StateSet() {
  const isLogin = useIsLogin()[0];
  const isSetList = [
    Boolean(useEnv()[0]),
    Boolean(useImageState().images),
    Boolean(useCharacters()[0]),
    Boolean(usePosts()[0]),
    Boolean(useSounds()[0]),
  ];
  return (
    <>
      <EnvState />
      <DataState />
      <SoundPlayer />
      <ImageViewer />
      <Toaster />
      <LoadingState isSetList={isSetList}>
        <ImageState />
        <CharacterState />
        <PostState />
        <SoundState />
      </LoadingState>
      {ThemeState.State()}
      {DarkThemeState.State()}
      {isLogin ? (
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
  const [isFirst, setIsFirst] = useSiteIsFirst();
  const [dataIsComplete, setIsComplete] = useDataIsComplete();
  const [pageIsComplete, setPageIsComplete] = usePageIsComplete();
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
