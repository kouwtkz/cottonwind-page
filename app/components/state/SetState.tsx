import { ToastContainer } from "react-toastify";
import { SoundPlayer } from "~/components/layout/SoundPlayer";
import { ImageViewer } from "~/components/layout/ImageViewer";
import { ImageState, useImageState } from "./ImageState";
import { useEnv, EnvState, useIsLogin } from "./EnvState";
import React, { use, useEffect, useMemo, useState } from "react";
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
import {
  ClientDBState,
  IdbStateIsLoaded,
  ClientDBLoaderHandler,
} from "~/data/ClientDBLoader";
import { Theme } from "../theme/Theme";
import { LangState } from "../multilingual/LangState";
import { FaviconState } from "./FaviconState";
import { rootClientServerData } from "../utils/SetMeta";
import { MiniCharacterPage } from "~/page/CharacterPage";
import RedirectState from "./redirectState";
import { ATPState, useATProtoState } from "./ATProtocolState";
import { NavKeepState } from "./NavState";
import { WindowSizeState } from "../hook/useWindowSize";
import { WindowScrollSizeState } from "../hook/useScrollSize";
import { WindowScrollState } from "../hook/useScroll";

let count = 0;
export const SetState = React.memo(function SetState({
  env,
  isLogin,
}: {
  env?: Partial<OmittedEnv>;
  isLogin?: boolean;
}) {
  const loadedIndex = useState<boolean>()[1];
  useEffect(() => {
    const id = setInterval(() => {
      if (count++ > 3000 || IdbStateIsLoaded) {
        clearInterval(id);
        loadedIndex(true);
        count = 3001;
      }
    }, 1);
  }, []);
  return (
    <>
      <CheckIsComplete />
      <WindowSizeState />
      <WindowScrollState />
      <WindowScrollSizeState />
      <EnvState env={env} isLogin={isLogin} />
      <NavKeepState />
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
});

export const useIsComplete = CreateState(false);
export const useIsLoading = CreateState(true);
export const useIsLoadedFloat = CreateState(0);

function CheckIsComplete() {
  const env = useEnv()[0];
  const loadedImages = Boolean(useImageState().images);
  const loadedCharacters = Boolean(useCharacters().charactersData);
  const loadedPosts = Boolean(usePosts().posts);
  const loadedSounds = Boolean(useSounds().soundsData);
  const loadedLinks = Boolean(useLinks().links);
  const { did, didInfo, describe, linkat, mochott_articles } =
    useATProtoState();
  const loadedATProtoDid = useMemo(() => typeof did !== "undefined", [did]);
  const loadedATProtoDidInfo = useMemo(
    () => typeof didInfo !== "undefined",
    [didInfo],
  );
  const loadedATProtoDescribe = useMemo(
    () => typeof describe !== "undefined",
    [describe],
  );
  const loadedATProtoLinkat = useMemo(() => Boolean(linkat), [linkat]);
  const loadedATProto_mochott_article = useMemo(
    () => Boolean(mochott_articles),
    [mochott_articles],
  );
  const loadingATProtocolMode = useMemo<
    "mochott" | "all" | "linkAt" | null
  >(() => {
    if (!env || !env.ATPROTO_USE_DID || !env.ATPROTO_USE_DIDINFO) return null;
    const pathname = typeof location !== "undefined" ? location.pathname : "";
    if (pathname === "/") {
      return "all";
    } else if (env.ATPROTO_USE_MOCHOTT && pathname.startsWith("/blog")) {
      return "mochott";
    } else if (env.ATPROTO_USE_LINKAT && pathname.startsWith("/links")) {
      return "linkAt";
    } else {
      return null;
    }
  }, [env]);
  const [isTimeout, setIsTimeout] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setIsTimeout(true);
    }, 2500);
  }, []);
  let loadedATProtocolList = useMemo(() => {
    const list: boolean[] = [];
    if (env && loadingATProtocolMode) {
      if (env.ATPROTO_USE_DID) list.push(loadedATProtoDid);
      if (env.ATPROTO_USE_DIDINFO) list.push(loadedATProtoDidInfo);
      if (env.ATPROTO_USE_DESCRIBE) list.push(loadedATProtoDescribe);
      if (
        loadingATProtocolMode === "linkAt" ||
        (env.ATPROTO_USE_LINKAT && loadingATProtocolMode === "all")
      ) {
        list.push(loadedATProtoLinkat);
      }
      if (
        loadingATProtocolMode === "mochott" ||
        (env.ATPROTO_USE_MOCHOTT && loadingATProtocolMode === "all")
      ) {
        list.push(loadedATProto_mochott_article);
      }
    }
    return list;
  }, [
    loadingATProtocolMode,
    loadedATProtoDid,
    loadedATProtoDidInfo,
    loadedATProtoDescribe,
    loadedATProtoLinkat,
    loadedATProto_mochott_article,
  ]);
  loadedATProtocolList = useMemo(() => {
    if (isTimeout && loadedATProtocolList.some((v) => !v))
      return loadedATProtocolList.concat().fill(true);
    else return loadedATProtocolList;
  }, [loadedATProtocolList, isTimeout]);
  const isSetList = useMemo(() => {
    const list = [
      Boolean(env),
      loadedImages,
      loadedCharacters,
      loadedPosts,
      loadedSounds,
      loadedLinks,
      ...loadedATProtocolList,
    ];
    return list;
  }, [
    env,
    loadedImages,
    loadedCharacters,
    loadedPosts,
    loadedSounds,
    loadedLinks,
    loadedATProtocolList,
  ]);
  const [clientDBLoading, setClientDBLoading] = useState(0);
  useEffect(() => {
    ClientDBLoaderHandler.addEventListener("onadd", () => {
      setClientDBLoading(
        Math.round(
          (10 * ClientDBLoaderHandler.count) / ClientDBLoaderHandler.length,
        ) / 10,
      );
    });
  }, []);
  const isSetListPer = useMemo(
    () => isSetList.reduce((a, c) => (c ? a + 1 : a), 0) / isSetList.length,
    [isSetList],
  );

  const setIsLoadedFloat = useIsLoadedFloat()[1];
  useEffect(() => {
    const value =
      (isSetListPer +
        Math.sqrt(clientDBLoading) * ClientDBLoaderHandler.denominator) /
      (1 + ClientDBLoaderHandler.denominator);
    setIsLoadedFloat(value);
  }, [isSetListPer, clientDBLoading]);
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
