import { useEffect, useState } from "react";
import { CreateState } from "../state/CreateState";
import { useIsLoading } from "../state/SetState";
import { useWindowSize } from "./useWindowSize";
import { useLocation } from "react-router";

export const useWindowScrollSize = CreateState<[number, number]>([0, 0]);

export function WindowScrollSizeState() {
  const ww = useWindowSize()[0][0];
  const location = useLocation();
  const isLoading = useIsLoading()[0];
  const setSize = useWindowScrollSize()[1];
  useEffect(() => {
    if (!isLoading) {
      setSize((state) => {
        const w = document.body.scrollWidth;
        const h = document.body.scrollHeight;
        if (w !== state[0] || h !== state[1]) return [w, h];
        else return state;
      });
    }
  }, [ww, isLoading, location]);
  return <></>;
}

export function useScrollSizeInstance(html?: HTMLElement): [number, number] {
  const [scrollSize, setScrollSize] = useState<[number, number]>([0, 0]);
  useEffect(() => {
    function updateScroll() {
      if (html) {
        setScrollSize([html.scrollWidth, html.scrollHeight]);
      } else {
        setScrollSize([document.body.scrollWidth, document.body.scrollHeight]);
      }
    }
    const listen = html || window;
    updateScroll();
    listen.addEventListener("scroll", updateScroll);
    return () => {
      listen.removeEventListener("scroll", updateScroll);
    };
  }, [html]);
  return scrollSize;
}
