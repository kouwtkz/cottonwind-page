import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { useRef } from "react";
import { StateSet } from "../state/StateSet";
import { SetTitleStr } from "../data/functions/SetMeta";
import { useCharaState } from "../state/CharaState";
import { serverSite as site } from "../data/server/site";

function SetTitle() {
  const { pathname, search } = useLocation();
  const { charaObject: characters } = useCharaState();
  const notFirst = useRef(false);
  if (notFirst.current) {
    document.title = SetTitleStr({
      path: pathname,
      query: search,
      characters,
      site,
    })!;
  } else {
    notFirst.current = true;
  }
  return <></>;
}

export function Base({ children }: { children?: React.ReactElement | null }) {
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
