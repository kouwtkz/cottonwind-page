import {
  RefObject,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import useScroll from "../hook/useScroll";
import TriangleCursor from "../svg/cursor/Triangle";

type InPageRefObject = {
  name: string;
  ref: RefObject<HTMLElement>;
};

export const InPageMenu = memo(function InPageMenu({
  list = [],
  adjust = 16,
  cursorAdjust = 64,
  lastAdjust = 8,
}: {
  list?: InPageRefObject[];
  adjust?: number;
  cursorAdjust?: number;
  lastAdjust?: number;
}) {
  const { y, h, wh } = useScroll();
  const jy = Math.floor(y + adjust + cursorAdjust);
  const isLastScroll = h - y - lastAdjust <= wh;
  const [parsedList, setParsedList] = useState<
    Array<{
      name: string;
      element: HTMLElement;
      currentMode?: boolean;
    }>
  >([]);
  useEffect(() => {
    const curList = list.map(({ name, ref }) => ({
      name,
      element: ref.current!,
    }));
    setParsedList(curList);
  }, [list]);
  const filterList = useMemo(() => {
    const list = parsedList.filter(({ element }) => element);
    const max = list.length - 1;
    list.forEach((item, i) => {
      const offsetTop = item.element.offsetTop;
      if (i !== 0) item.currentMode = offsetTop <= jy;
      else item.currentMode = jy < offsetTop + item.element.offsetHeight;
      if (i === max && !item.currentMode) item.currentMode = isLastScroll;
    });
    const lastCurrentMode = list.findLastIndex((item) => item.currentMode);
    list.forEach((item, i) => {
      if (lastCurrentMode !== i) item.currentMode = false;
    });
    return list;
  }, [parsedList, jy, isLastScroll]);
  return (
    <div className="InPageMenu">
      {filterList.map(({ name, element, currentMode }, i) => {
        return (
          <div
            key={i}
            className={"item" + (currentMode ? " current" : "")}
            onClick={() => {
              const top = (element.offsetTop || 0) - adjust;
              scrollTo({ top, behavior: "smooth" });
            }}
          >
            <div className="cursor">
              {currentMode ? <TriangleCursor /> : null}
            </div>
            <div className="name">
              <span>{name}</span>
            </div>
          </div>
        );
      })}
      <div className="background" />
    </div>
  );
});
