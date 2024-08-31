import { DataState } from "./DataState";
import { Toaster } from "react-hot-toast";
import { SoundPlayer } from "./SoundPlayer";
import { ImageViewer } from "./ImageViewer";
import { ImageState, useImageState } from "./ImageState";
import { EmbedState } from "./Embed";
import { ThemeStateClass } from "./ThemeSetter";
import { FeedState, outFeedAtom } from "./FeedState";
import { EnvAtom, EnvState } from "./EnvState";
import { useAtom } from "jotai";

export const ThemeState = new ThemeStateClass("theme", [
  "theme-orange",
  "theme-aqua",
]);
export const DarkThemeState = new ThemeStateClass("darktheme", [
  "dark",
  "auto",
]);

export function StateSet() {
  const isSetList = [
    useImageState().imageObject.isSet,
    Boolean(useAtom(EnvAtom)[0]),
    Boolean(useAtom(outFeedAtom)[0]),
  ];
  return (
    <>
      <EnvState />
      <SoundPlayer />
      <ImageViewer />
      <Toaster />
      <DataState isSetList={isSetList}>
        <ImageState />
        <FeedState />
      </DataState>
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
