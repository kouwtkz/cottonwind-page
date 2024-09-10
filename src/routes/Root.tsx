import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { Header } from "@/layout/Header";
import { Footer } from "@/layout/Footer";
import { ReactNode, useLayoutEffect, useState } from "react";
import { useAtom } from "jotai";
import { MetaValues } from "./SetMeta";
import { charactersMapAtom } from "@/state/CharaState";
import { isMobile } from "react-device-detect";
import { imagesAtom } from "@/state/ImageState";
import { postsAtom } from "@/state/PostState";
import { StateSet, dataIsCompleteAtom } from "@/state/StateSet";
import { EnvAtom } from "@/state/EnvState";

function SetTitle() {
  const { pathname, search } = useLocation();
  const characters = useAtom(charactersMapAtom)[0];
  const images = useAtom(imagesAtom)[0];
  const [isComplete] = useAtom(dataIsCompleteAtom);
  const [notFirst, setNotFirst] = useState(false);
  const posts = useAtom(postsAtom)[0];
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
