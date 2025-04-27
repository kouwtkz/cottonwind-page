import { ToastContainer } from "react-toastify";
import { SoundPlayer } from "./SoundPlayer";
import { ImageViewer } from "@/layout/ImageViewer";
import { DataState } from "@/data/DataState";
import { ImageState, useImageState } from "./ImageState";
import { useEnv, EnvState, useIsLogin } from "./EnvState";
import { useEffect, useMemo, useRef } from "react";
import { CharacterState, useCharacters } from "./CharacterState";
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
import { KeyValueDBState, useKeyValueDB } from "./KeyValueDBState";
import { CalendarMeeState } from "@/calendar/CalendarMee";
import { FaviconState } from "./FaviconState";

export const useSiteIsFirst = CreateState(true);
export const useDataIsComplete = CreateState(false);
export const usePageIsComplete = CreateState(true);

export function StateSet() {
  return (
    <>
      <EnvState />
      <DataState />
      <FaviconState />
      <SoundPlayer />
      <ImageViewer />
      <MiniGallery />
      <ToastContainer {...defaultToastContainerOptions} />
      <ToastProgressState />
      <HomeImageState />
      <CalendarState />
      <LoadingStateWrapper />
    </>
  );
}

function CalendarState() {
  const env = useEnv()[0];
  const { kvList } = useKeyValueDB();
  const isLogin = useIsLogin()[0];
  const googleCalendarList = useMemo(() => {
    if (env && kvList) {
      const list: { id: string; private?: boolean }[] = [];
      if (env.GOOGLE_CALENDAR_ID) list.push({ id: env.GOOGLE_CALENDAR_ID });
      kvList
        .filter((v) => v.key.startsWith("google-calendar-id-"))
        .forEach(({ value, private: p }) => {
          if (value) list.push({ id: value, private: p });
        });
      return list;
    }
  }, [kvList, env]);
  const API_KEY = useMemo(() => env?.GOOGLE_CALENDAR_API, [env]);
  return (
    <CalendarMeeState
      googleApiKey={API_KEY}
      defaultCalendarList={googleCalendarList}
      enableMarkdownCopy={isLogin}
    />
  );
}

const loadingCheckID = "Element_DateState_Loading_NotEnd";
const reloadFunction =
  process.env.NODE_ENV === "development"
    ? `setTimeout(() => {if (document.getElementById("${loadingCheckID}")) location.reload()}, 5000)`
    : "";

function LoadingStateWrapper() {
  const isSetList = [
    Boolean(useEnv()[0]),
    Boolean(useImageState().images),
    Boolean(useCharacters().characters),
    Boolean(usePosts().posts),
    Boolean(useSounds().sounds),
    Boolean(useLinks().links),
  ];
  return (
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
  );
}
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
