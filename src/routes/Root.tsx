import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { Header } from "@/layout/Header";
import { Footer } from "@/layout/Footer";
import { ReactNode, useLayoutEffect, useState } from "react";
import { useAtom } from "jotai";
import { dataIsCompleteAtom } from "@/state/DataState";
import { MetaValues } from "./SetMeta";
import { charactersMapAtom } from "@/state/CharaState";
import { isMobile } from "react-device-detect";
import { imagesAtom } from "@/state/ImageState";
import { usePostState } from "@/blog/PostState";
import { StateSet } from "@/state/StateSet";
import { EnvAtom } from "@/state/EnvState";

function SetTitle() {
  const { pathname, search } = useLocation();
  const characters = useAtom(charactersMapAtom)[0];
  const images = useAtom(imagesAtom)[0];
  const [isComplete] = useAtom(dataIsCompleteAtom);
  const [notFirst, setNotFirst] = useState(false);
  const { posts } = usePostState();
  const [env] = useAtom(EnvAtom);
  if (notFirst) {
    document.title = MetaValues({
      path: pathname,
      query: search,
      characters,
      images,
      posts,
      env: env ?? { TITLE: document.title },
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
