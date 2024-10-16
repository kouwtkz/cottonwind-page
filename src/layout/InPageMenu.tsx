import { RefObject, memo, useEffect, useMemo, useState } from "react";
import useScroll from "@/components/hook/useScroll";
import TriangleCursor from "@/components/svg/cursor/Triangle";

type InPageRefObject = {
  name: string;
  ref: RefObject<HTMLElement>;
};

interface InPageMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  list?: InPageRefObject[];
  adjust?: number;
  cursorAdjust?: number;
  lastAdjust?: number;
  autoLastHide?: number;
}
export const InPageMenu = memo(function InPageMenu({
  list = [],
  adjust = 16,
  cursorAdjust = 64,
  lastAdjust = 8,
  autoLastHide = 0,
  className,
  ...props
}: InPageMenuProps) {
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
    const secondOffsetTop = list[1]?.element.offsetTop;
    list.forEach((item, i) => {
      const offsetTop = item.element.offsetTop;
      if (i !== 0) item.currentMode = offsetTop <= jy;
      else item.currentMode = !secondOffsetTop || secondOffsetTop > jy;
      if (i === max && !item.currentMode) item.currentMode = isLastScroll;
    });
    const lastCurrentMode = list.findLastIndex((item) => item.currentMode);
    list.forEach((item, i) => {
      if (lastCurrentMode !== i) item.currentMode = false;
    });
    return list;
  }, [parsedList, jy, isLastScroll]);
  const lastHide = useMemo(
    () => Math.ceil(y + wh) >= h - autoLastHide,
    [y, h, wh, autoLastHide]
  );
  className = useMemo(() => {
    const list = ["InPageMenu en-title-font"];
    if (className) list.push(className);
    if (lastHide) list.push("hide");
    return list.join(" ");
  }, [className, lastHide]);
  return (
    <div {...props} className={className}>
      {filterList.map(({ name, element, currentMode }, i) => {
        return (
          <div
            key={i}
            className={"item cursor-pointer" + (currentMode ? " current" : "")}
            onClick={() => {
              const top = (element.offsetTop || 0) - adjust;
              scrollTo({ top, behavior: "smooth" });
            }}
          >
            <div className="cursor">
              {currentMode ? <TriangleCursor /> : null}
            </div>
            <div className="name">
              <span>{name.toLocaleUpperCase()}</span>
            </div>
          </div>
        );
      })}
      <div className="background" />
    </div>
  );
});
