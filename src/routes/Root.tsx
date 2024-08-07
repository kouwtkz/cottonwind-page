import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { Header } from "@/layout/Header";
import { Footer } from "@/layout/Footer";
import { ReactNode, useLayoutEffect, useState } from "react";
import { StateSet, useDataState } from "@/state/StateSet";
import { MetaValues } from "./SetMeta";
import { useCharaState } from "@/state/CharaState";
import { isMobile } from "react-device-detect";
import { useImageState } from "@/state/ImageState";
import { usePostState } from "@/blog/PostState";

function SetTitle() {
  const { pathname, search } = useLocation();
  const { charaObject: characters } = useCharaState();
  const { imageItemList: images } = useImageState().imageObject;
  const { isComplete } = useDataState();
  const [notFirst, setNotFirst] = useState(false);
  const { posts } = usePostState();
  if (notFirst) {
    document.title = MetaValues({
      path: pathname,
      query: search,
      characters,
      images,
      posts,
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
