import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { Header } from "@/layout/Header";
import { Footer } from "@/layout/Footer";
import { ReactNode, useLayoutEffect, useState } from "react";
import { useAtom } from "jotai";
import { dataIsCompleteAtom } from "@/state/DataState";
import { MetaValues } from "./SetMeta";
import { useCharaState } from "@/state/CharaState";
import { isMobile } from "react-device-detect";
import { useImageState } from "@/state/ImageState";
import { usePostState } from "@/blog/PostState";
import { StateSet } from "@/state/StateSet";
import { CodeCheck } from "@/components/parse/CodeCheck";

function SetTitle() {
  const { pathname, search } = useLocation();
  const { charaObject: characters } = useCharaState();
  const { imageItemList: images } = useImageState().imageObject;
  const [isComplete] = useAtom(dataIsCompleteAtom);
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
  useLayoutEffect(() => {
    if (isMobile) {
      document.body.classList.add("mobile");
    }
  }, []);
  return (
    <>
      <ScrollRestoration />
      <StateSet />
      <CodeCheck />
      <Header />
      <div className="content-base">
        <div className="content-parent">{children}</div>
        <Footer />
      </div>
      <div id="audio_background" />
    </>
  );
}

export default function Root() {
  return (
    <>
      <SetTitle />
      <Base>
        <Outlet />
      </Base>
    </>
  );
}
