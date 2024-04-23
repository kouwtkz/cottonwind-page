import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { ReactNode, useLayoutEffect, useState } from "react";
import { StateSet, useDataState } from "../state/StateSet";
import { MetaStrs } from "./SetMeta";
import { useCharaState } from "../state/CharaState";
import { serverSite as site } from "../data/server/site";
import { isMobile } from "react-device-detect";
import { useImageState } from "../state/ImageState";

function SetTitle() {
  const { pathname, search } = useLocation();
  const { charaObject: characters } = useCharaState();
  const { imageItemList: images } = useImageState();
  const { isComplete } = useDataState();
  const [notFirst, setNotFirst] = useState(false);
  if (notFirst) {
    document.title = MetaStrs({
      path: pathname,
      query: search,
      characters,
      images,
      site,
    })!.title;
  } else if (isComplete) setNotFirst(true);
  return <></>;
}

export function Base({ children }: { children?: ReactNode }) {
  return (
    <>
      <Header />
      <div className="content-base">
        <div className="content-parent">{children}</div>
        <Footer />
      </div>
      <div id="audio_background" />
      <StateSet />
    </>
  );
}

export default function Root() {
  useLayoutEffect(() => {
    if (isMobile) {
      document.body.classList.add("mobile");
    }
  });
  return (
    <>
      <ScrollRestoration />
      <SetTitle />
      <Base>
        <Outlet />
      </Base>
    </>
  );
}
