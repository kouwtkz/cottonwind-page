import { useLayoutEffect, useState } from "react";

interface useScrollResult {
  x: number;
  y: number;
  w: number;
  h: number;
  ww: number;
  wh: number;
}
const defaultResult = { x: 0, y: 0, w: 0, h: 0, ww: 0, wh: 0 };

export default function useScroll(): useScrollResult {
  const [scroll, setScroll] = useState(defaultResult);
  useLayoutEffect(() => {
    const updateSize = (): void => {
      setScroll({
        x: window.scrollX,
        y: window.scrollY,
        w: document.body.scrollWidth,
        h: document.body.scrollHeight,
        ww: window.innerWidth,
        wh: window.innerHeight,
      });
    };
    window.addEventListener("scroll", updateSize);
    updateSize();
    return () => window.removeEventListener("scroll", updateSize);
  }, []);
  return scroll;
}
