import { useEffect, useState } from "react";
import { CreateState } from "../state/CreateState";

export const useWindowScrollSize = CreateState<[number, number]>([0, 0]);

export function WindowScrollSizeState() {
  const setSize = useWindowScrollSize()[1];
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const w = document.body.scrollWidth;
      const h = document.body.scrollHeight;
      setSize([w, h]);
    });
    observer.observe(document.body);
    return () => {
      observer.disconnect();
    };
  }, []);
  return <></>;
}

export function useScrollSizeInstance(
  html: HTMLElement | null,
): [number, number] {
  const [scrollSize, setSize] = useState<[number, number]>([0, 0]);
  useEffect(() => {
    if (!html) return;
    const observer = new MutationObserver(() => {
      setSize((state) => {
        const w = html.scrollWidth;
        const h = html.scrollHeight;
        if (w !== state[0] || h !== state[1]) return [w, h];
        else return state;
      });
    });
    observer.observe(html, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, [html]);
  return scrollSize;
}
