import { useEffect, useState } from "react";

interface useScrollResult {
  x: number;
  y: number;
  w: number;
  h: number;
}
const defaultResult = { x: 0, y: 0, w: 0, h: 0};

export function useScrollInstance({
  html,
  key,
}: {
  html?: HTMLElement;
  key?: unknown;
} = {}): useScrollResult {
  const [scroll, setScroll] = useState(defaultResult);
  useEffect(() => {
    function updateScroll() {
      setScroll((state) => {
        if (html) {
          state.x = html.scrollLeft;
          state.y = html.scrollTop;
          state.w = html.scrollWidth;
          state.h = html.scrollHeight;
        } else {
          state.x = window.scrollX;
          state.y = window.scrollY;
          state.w = document.body.scrollWidth;
          state.h = document.body.scrollHeight;
        }
        return { ...state };
      });
    }
    const listen = html || window;
    updateScroll();
    listen.addEventListener("scroll", updateScroll);
    return () => {
      listen.removeEventListener("scroll", updateScroll);
    };
  }, [html, key]);
  return scroll;
}
