import { ToastContainer } from "react-toastify";
import { SoundPlayer } from "./SoundPlayer";
import { ImageViewer } from "@/layout/ImageViewer";
import { DataState } from "./DataState";
import { ImageState, useImageState } from "./ImageState";
import { useEnv, EnvState, useIsLogin } from "./EnvState";
import { useEffect, useMemo, useRef } from "react";
import { useCharacters, CharacterState } from "./CharacterState";
import PostState, { usePosts } from "./PostState";
import { SoundState, useSounds } from "./SoundState";
import { CreateState } from "./CreateState";
import FileState from "./FileState";
import { defaultToastContainerOptions } from "@/components/define/toastContainerDef";
import { ToastProgressState } from "./ToastProgress";
import { MiniGallery } from "@/routes/GalleryPage";
import { LinksState, useLinks } from "./LinksState";
import { LikeState } from "./LikeState";
import { HomeImageState } from "@/routes/Home";
import { KeyValueDBState } from "./KeyValueDBState";
import { CalendarMeeState } from "@/calendar/CalendarMee";

export const useSiteIsFirst = CreateState(true);
export const useDataIsComplete = CreateState(false);
export const usePageIsComplete = CreateState(true);

export function StateSet() {
  const isSetList = [
    Boolean(useEnv()[0]),
    Boolean(useImageState().images),
    Boolean(useCharacters()[0]),
    Boolean(usePosts()[0]),
    Boolean(useSounds()[0]),
    Boolean(useLinks()[0]),
  ];
  return (
    <>
      <EnvState />
      <DataState />
      <SoundPlayer />
      <ImageViewer />
      <MiniGallery />
      <ToastContainer {...defaultToastContainerOptions} />
      <ToastProgressState />
      <HomeImageState />
      <CalendarMeeState />
      <LoadingState isSetList={isSetList}>
        <ImageState />
        <CharacterState />
        <PostState />
        <SoundState />
        <FileState />
        <LinksState />
        <LikeState />
        <KeyValueDBState />
      </LoadingState>
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
    () => Boolean(dataIsComplete && pageIsComplete),
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
    setTimeout(() => {
      if (!isCompleteRef.current) {
        setIsComplete(true);
        setPageIsComplete(true);
      }
    }, 5000);
  }, []);
  useEffect(() => {
    const html = document.querySelector("html");
    if (isComplete) {
      document.body.classList.remove("dummy");
      html?.classList.remove("loading");
      if (location.hash) {
        const elm = document.querySelector(location.hash) as HTMLElement | null;
        if (elm) {
          let scrollY = elm.offsetTop;
          const html = document.querySelector("html") as HTMLElement | null;
          if (html) {
            const m = getComputedStyle(html)["scrollPadding"].match(/^(\d+)px/);
            if (m) scrollY = scrollY - Number(m[1]);
          }
          setTimeout(() => {
            window.scrollTo({ top: scrollY });
          }, 0);
        }
      }
    } else {
      html?.classList.add("loading");
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
