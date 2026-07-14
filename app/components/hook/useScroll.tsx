import { useEffect, useState } from "react";
import { CreateState } from "../state/CreateState";
import { useIsLoading } from "../state/SetState";

export const useWindowScroll = CreateState<[number, number]>([0, 0]);

export function WindowScrollState() {
  const setScroll = useWindowScroll()[1];
  const isLoading = useIsLoading()[0];
  useEffect(() => {
    function updateScroll() {
      setScroll((state) => {
        const x = window.scrollX;
        const y = window.scrollY;
        if (x !== state[0] || y !== state[1]) return [x, y];
        else return state;
      });
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

export function useScrollInstance(html: HTMLElement | null): [number, number] {
  const [scroll, setScroll] = useState<[number, number]>([0, 0]);
  useEffect(() => {
    if (!html) return;
    function updateScroll() {
      setScroll((state) => {
        const x = html!.scrollLeft;
        const y = html!.scrollTop;
        if (x !== state[0] || y !== state[1]) return [x, y];
        else return state;
      });
    }
    updateScroll();
    html.addEventListener("scroll", updateScroll);
    return () => {
      html.removeEventListener("scroll", updateScroll);
    };
  }, [html]);
  return scroll;
}
