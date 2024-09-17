import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { HeaderClient } from "@/layout/Header";
import { Footer } from "@/layout/Footer";
import { ReactNode, useLayoutEffect, useState } from "react";
import { useAtom } from "jotai";
import { MetaValues } from "./SetMeta";
import { charactersMapAtom } from "@/state/CharacterState";
import { isMobile } from "react-device-detect";
import { useImageState } from "@/state/ImageState";
import { postsAtom } from "@/state/PostState";
import { StateSet, dataIsCompleteAtom } from "@/state/StateSet";
import { EnvAtom, MediaOriginAtom } from "@/state/EnvState";

function SetTitle() {
  const { pathname, search } = useLocation();
  const charactersMap = useAtom(charactersMapAtom)[0];
  const { imagesMap } = useImageState();
  const [isComplete] = useAtom(dataIsCompleteAtom);
  const [notFirst, setNotFirst] = useState(false);
  const posts = useAtom(postsAtom)[0];
  const mediaOrigin = useAtom(MediaOriginAtom)[0];
  const [env] = useAtom(EnvAtom);
  if (notFirst) {
    document.title = MetaValues({
      path: pathname,
      query: search,
      charactersMap,
      imagesMap,
      posts,
      mediaOrigin,
      env: env ?? { TITLE: document.title },
    })!.title;
  } else if (isComplete) setNotFirst(true);
  return <></>;
}

export function Base({ children }: { children?: ReactNode }) {
  const env = useAtom(EnvAtom)[0];
  useLayoutEffect(() => {
    if (isMobile) {
      document.body.classList.add("mobile");
    }
  }, []);
  return (
    <>
      <ScrollRestoration />
      <StateSet />
      <HeaderClient env={env} />
      <div className="content-base">
        <div className="content-parent">{children}</div>
        <Footer env={env} />
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
