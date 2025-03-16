import { CreateObjectState } from "@/state/CreateState";
import { useCallback, useEffect } from "react";

interface useClickVectorType extends Vector {
  element: Element | null;
  clicked: boolean;
  timeStamp: number;
}
export const useClickEvent = CreateObjectState<useClickVectorType>({
  x: 0,
  y: 0,
  element: null,
  clicked: false,
  timeStamp: 0,
});

export function ClickEventState() {
  const { Set } = useClickEvent();
  const onClick = useCallback((e: MouseEvent) => {
    const { x, y, timeStamp } = e;
    const element = document.elementFromPoint(x, y);
    Set({ x, y, element, timeStamp, clicked: true });
  }, []);
  useEffect(() => {
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("click", onClick);
    };
  }, []);
  return <></>;
}
