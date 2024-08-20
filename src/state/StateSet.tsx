import { DataState } from "./DataState";
import { Toaster } from "react-hot-toast";
import { SoundPlayer } from "./SoundPlayer";
import { ImageViewer } from "./ImageViewer";
import { ImageState, useImageState } from "./ImageState";
import { EmbedState } from "./Embed";
import { useEffect } from "react";
import { create } from "zustand";
import { ThemeStateClass } from "./ThemeSetter";
import { FeedState, useFeedState } from "./FeedState";
import { useCookies } from "react-cookie";

export const ThemeState = new ThemeStateClass("theme", [
  "theme-orange",
  "theme-aqua",
]);
export const DarkThemeState = new ThemeStateClass("darktheme", [
  "dark",
  "auto",
]);

export function StateSet() {
  const isSetList = [useFeedState().isSet, useImageState().imageObject.isSet];
  return (
    <>
      <SoundPlayer />
      <ImageViewer />
      <Toaster />
      <DataState isSetList={isSetList}>
        <ImageState />
        <FeedState />
      </DataState>
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
