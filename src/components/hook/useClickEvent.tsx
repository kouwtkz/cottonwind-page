import { CreateObjectState } from "@/state/CreateState";
import { useEffect } from "react";

interface useClickVectorType extends Vector {
  element: Element | null;
}
export const useClickEvent = CreateObjectState<useClickVectorType>({
  x: 0,
  y: 0,
  element: null,
});

export function ClickEventState() {
  const { Set } = useClickEvent();
  function onClick(e: MouseEvent) {
    const { x, y } = e;
    const element = document.elementFromPoint(x, y);
    Set({ x, y, element });
  }
  useEffect(() => {
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("click", onClick);
    };
  }, []);
  return <></>;
}
