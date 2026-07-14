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
  listen: HTMLElement | Window | null = null,
) {
  listen = useMemo(
    () => (listen ? listen : typeof window !== "undefined" ? window : null),
    [listen],
  );
  const callback = useMemo(() => {
    if (!listen) {
      return () => 0;
    } else if ("innerWidth" in listen) {
      return () => listen.innerWidth;
    } else {
      return () => listen.clientWidth;
    }
  }, [listen]);
  return useSyncExternalStore(subscribe(listen), callback, () => 0);
}
export function useWindowHeightInstance(
  listen: HTMLElement | Window | null = null,
) {
  listen = useMemo(
    () => (listen ? listen : typeof window !== "undefined" ? window : null),
    [listen],
  );
  const callback = useMemo(() => {
    if (!listen) {
      return () => 0;
    } else if ("innerHeight" in listen) {
      return () => listen.innerHeight;
    } else {
      return () => listen.clientHeight;
    }
  }, [listen]);
  return useSyncExternalStore(subscribe(listen), callback, () => 0);
}

export function useWindowSizeInstance(
  listen: HTMLElement | Window | null = null,
) {
  const width = useWindowWidthInstance(listen);
  const height = useWindowHeightInstance(listen);
  return useMemo(() => [width, height], [width, height]);
}

export const useWindowSize = CreateState<[number, number]>([0, 0]);
export function WindowSizeState() {
  const set = useWindowSize()[1];
  const [w, h] = useWindowSizeInstance();
  useEffect(() => {
    set([w, h]);
  }, [w, h]);
  return <></>;
}
