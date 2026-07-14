import { useEffect, useState } from "react";
import { CreateState } from "../state/CreateState";
import { useIsLoading } from "../state/SetState";

export const useWindowScroll = CreateState<[number, number]>([0, 0]);

export function WindowScrollState() {
  const setScroll = useWindowScroll()[1];
  const isLoading = useIsLoading()[0];
  useEffect(() => {
    function updateScroll() {
      setScroll([window.scrollX, window.scrollY]);
    }
    window.addEventListener("scroll", updateScroll);
    return () => {
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);
  useEffect(() => {
    if (!isLoading) {
      setScroll([window.scrollX, window.scrollY]);
    }
  }, [isLoading]);
  return <></>;
}

export function useScrollInstance(html?: HTMLElement): [number, number] {
  const [scroll, setScroll] = useState<[number, number]>([0, 0]);
  useEffect(() => {
    function updateScroll() {
      if (html) {
        setScroll([html.scrollLeft, html.scrollTop]);
      } else {
        setScroll([window.scrollX, window.scrollY]);
      }
    }
    const listen = html || window;
    updateScroll();
    listen.addEventListener("scroll", updateScroll);
    return () => {
      listen.removeEventListener("scroll", updateScroll);
    };
  }, [html]);
  return scroll;
}
