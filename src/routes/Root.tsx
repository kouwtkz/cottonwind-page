import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { HeaderClient } from "@/layout/Header";
import { Footer } from "@/layout/Footer";
import {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { MetaValues } from "./SetMeta";
import { useCharacters } from "@/state/CharacterState";
import { isMobile } from "react-device-detect";
import { useImageState } from "@/state/ImageState";
import { usePosts } from "@/state/PostState";
import { StateSet, useDataIsComplete } from "@/state/StateSet";
import { useEnv, useMediaOrigin } from "@/state/EnvState";

function SetTitle() {
  const { pathname, search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const { charactersMap } = useCharacters();
  const { imagesMap } = useImageState();
  const imageItem = useMemo(() => {
    if (imagesMap && searchParams.has("image")) {
      return imagesMap.get(searchParams.get("image")!);
    }
  }, [imagesMap, searchParams]);
  const [isComplete] = useDataIsComplete();
  const [notFirst, setNotFirst] = useState(false);
  const { postsMap } = usePosts();
  const post = useMemo(() => {
    const postId = searchParams.get("postId") || "";
    return postsMap?.get(postId);
  }, [postsMap, searchParams]);
  const mediaOrigin = useMediaOrigin()[0];
  const [env] = useEnv();
  if (notFirst) {
    document.title = MetaValues({
      path: pathname,
      query: search,
      charactersMap,
      imageItem,
      post,
      mediaOrigin,
      env: env ?? { TITLE: document.title },
    })!.title;
  } else if (isComplete) setNotFirst(true);
  return <></>;
}

export function Base({ children }: { children?: ReactNode }) {
  const env = useEnv()[0];
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
