import { ToastContainer } from "react-toastify";
import { SoundPlayer } from "~/components/layout/SoundPlayer";
import { ImageViewer } from "~/components/layout/ImageViewer";
import { ImageState, useImageState } from "./ImageState";
import { useEnv, EnvState, useIsLogin } from "./EnvState";
import { useEffect, useMemo, useRef } from "react";
import { CharacterState, useCharacters } from "./CharacterState";
import PostState, { usePosts } from "./PostState";
import { SoundState, useSounds } from "./SoundState";
import { CreateState } from "./CreateState";
import FileState from "./FileState";
import { defaultToastContainerOptions } from "~/components/define/toastContainerDef";
import { ToastProgressState } from "./ToastProgress";
import { MiniGallery } from "~/page/GalleryPage";
import { LinksState, useLinks } from "./LinksState";
import { LikeState } from "./LikeState";
import { HomeImageState } from "~/page/Home";
import { KeyValueDBState, useKeyValueDB } from "./KeyValueDBState";
import { CalendarMeeState, useCalendarMee } from "~/calendar/CalendarMee";
// import { FaviconState } from "./FaviconState";
import type { OmittedEnv } from "types/custom-configuration";
import { ClickEventState } from "../click/useClickEvent";
import { ClientDBState } from "~/data/ClientDBLoader";
import type {
  ImageIndexedDataStateClass,
  IndexedDataLastmodMH,
} from "~/data/IndexedDB/IndexedDataLastmodMH";
import { Theme } from "../theme/Theme";
import { LangState } from "../multilingual/LangState";
import { FaviconState } from "./FaviconState";
import { rootClientServerData } from "../utils/SetMeta";
import { MiniCharacterPage } from "~/page/CharacterPage";
import RedirectState from "./redirectState";
import { ATPState, useATProtoState } from "./ATProtocolState";
import { ATProtocolEnv } from "~/Env";

export function SetState({
  env,
  isLogin,
}: {
  env?: Partial<OmittedEnv>;
  isLogin?: boolean;
}) {
  return (
    <>
      <CheckIsComplete />
      <EnvState env={env} isLogin={isLogin} />
      <ClickEventState />
      <ATPState />
      {/* <FaviconState /> */}
      <SoundPlayer />
      <ImageViewer />
      <MiniGallery />
      <MiniCharacterPage />
      <ToastContainer {...defaultToastContainerOptions} />
      <ToastProgressState />
      <HomeImageState />
      <CalendarState />
      <ImageState />
      <CharacterState />
      <PostState />
      <SoundState />
      <FileState />
      <LinksState />
      <LikeState />
      <KeyValueDBState />
      <RedirectState />
      <ClientDBState />
      <Theme />
      <LangState />
      <FaviconState />
    </>
  );
}

export const useIsComplete = CreateState(false);
export const useIsLoaded = CreateState<boolean[]>([]);

function CheckIsComplete() {
  const loadedEnv = Boolean(useEnv()[0]);
  const loadedImages = Boolean(useImageState().images);
  const loadedCharacters = Boolean(useCharacters().characters);
  const loadedPosts = Boolean(usePosts().posts);
  const loadedSounds = Boolean(useSounds().sounds);
  const loadedLinks = Boolean(useLinks().links);
  const { did, didInfo, describe, linkat } = useATProtoState();
  const loadedATProtoDid = useMemo(() => typeof did !== "undefined", [did]);
  const loadedATProtoDidInfo = useMemo(
    () => typeof didInfo !== "undefined",
    [didInfo]
  );
  const loadedATProtoDescribe = useMemo(
    () => typeof describe !== "undefined",
    [describe]
  );
  const loadedATProtoLinkat = useMemo(() => Boolean(linkat), [linkat]);
  const isSetList = useMemo(() => {
    const list = [
      loadedEnv,
      loadedImages,
      loadedCharacters,
      loadedPosts,
      loadedSounds,
      loadedLinks,
    ];
    if (ATProtocolEnv.setDid) list.push(loadedATProtoDid);
    if (ATProtocolEnv.setDidInfo) list.push(loadedATProtoDidInfo);
    if (ATProtocolEnv.setDescribe) list.push(loadedATProtoDescribe);
    if (ATProtocolEnv.setLinkat) list.push(loadedATProtoLinkat);
    return list;
  }, [
    loadedEnv,
    loadedImages,
    loadedCharacters,
    loadedPosts,
    loadedSounds,
    loadedLinks,
    loadedATProtoDid,
    loadedATProtoDidInfo,
    loadedATProtoDescribe,
    loadedATProtoLinkat,
  ]);
  const setIsLoaded = useIsLoaded()[1];
  useEffect(() => {
    setIsLoaded(isSetList);
  }, [isSetList]);
  const setIsComplete = useIsComplete()[1];
  const isComplete = useMemo(() => isSetList.every((v) => v), [isSetList]);
  useEffect(() => {
    if (isComplete && rootClientServerData.data) {
      setIsComplete(isComplete);
    }
  }, [isComplete, rootClientServerData]);
  return <></>;
}

function CalendarState() {
  const env = useEnv()[0];
  const { setLoading } = useCalendarMee();
  const { kvList, isLoading } = useKeyValueDB();
  const currentIsLoading = useMemo(() => !env || isLoading, [env, isLoading]);
  useEffect(() => {
    if (currentIsLoading) setLoading(true);
    else {
      setTimeout(() => {
        setLoading(false);
      }, 0);
    }
  }, [currentIsLoading]);
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
      firstFade
    />
  );
}
