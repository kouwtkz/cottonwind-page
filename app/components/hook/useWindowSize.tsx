import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { CreateState } from "../state/CreateState";

function subscribe(listen: HTMLElement | Window | null) {
  return (callback: () => void) => {
    if (!listen) return () => {};
    else if ("innerHeight" in listen) {
      listen.addEventListener("resize", callback);
      return () => listen.removeEventListener("resize", callback);
    } else {
      const resizeObserver = new ResizeObserver(() => {
        callback();
      });
      resizeObserver.observe(listen);
      return () => resizeObserver.disconnect();
    }
  };
}

export function useWindowWidthInstance(
  html: HTMLElement | Window | null = null,
) {
  const callback = useMemo(() => {
    if (!html) {
      return () => 0;
    } else if ("innerWidth" in html) {
      return () => html.innerWidth;
    } else {
      return () => html.clientWidth;
    }
  }, [html]);
  return useSyncExternalStore(subscribe(html), callback, () => 0);
}
export function useWindowHeightInstance(
  html: HTMLElement | Window | null = null,
) {
  const callback = useMemo(() => {
    if (!html) {
      return () => 0;
    } else if ("innerHeight" in html) {
      return () => html.innerHeight;
    } else {
      return () => html.clientHeight;
    }
  }, [html]);
  return useSyncExternalStore(subscribe(html), callback, () => 0);
}

export function useWindowSizeInstance(
  html: HTMLElement | Window | null = null,
) {
  const width = useWindowWidthInstance(html);
  const height = useWindowHeightInstance(html);
  return useMemo<[number, number]>(() => [width, height], [width, height]);
}

export const useWindowSize = CreateState<[number, number]>([0, 0]);
export function WindowSizeState() {
  const windowRef = useRef(typeof window !== "undefined" ? window : null);
  const set = useWindowSize()[1];
  const [w, h] = useWindowSizeInstance(windowRef.current);
  useEffect(() => {
    set([w, h]);
  }, [w, h]);
  return <></>;
}
