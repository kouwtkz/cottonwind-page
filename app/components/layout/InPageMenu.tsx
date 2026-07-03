import { useEffect, useMemo, useState } from "react";
import useScroll from "~/components/hook/useScroll";
import TriangleCursor from "~/components/svg/cursor/Triangle";

interface InPageArgList {
  name?: string;
  id: string;
}
interface InPageFilterList extends InPageArgList {
  element: HTMLElement;
}
interface InPageListObject extends InPageFilterList {
  currentMode?: boolean;
}

interface InPageMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  list?: InPageArgList[];
  adjust?: number;
  cursorAdjust?: number;
  lastAdjust?: number;
  autoLastHide?: number;
}
export function InPageMenu({
  list: arglist = [],
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
  const [filterList, setFilterList] = useState<InPageFilterList[]>([]);
  useEffect(() => {
    const filterList = arglist
      .map((v) => {
        return { element: document.getElementById(v.id), ...v };
      })
      .filter((v) => Boolean(v.element)) as InPageFilterList[];
    setFilterList(filterList);
  }, [arglist]);
  const list = useMemo(() => {
    const list: InPageListObject[] = filterList.concat();
    const max = filterList.length - 1;
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
  }, [filterList, jy, isLastScroll]);
  const lastHide = useMemo(
    () => Math.ceil(y + wh) >= h - autoLastHide,
    [y, h, wh, autoLastHide],
  );
  className = useMemo(() => {
    const list = ["InPageMenu en-title-font"];
    if (className) list.push(className);
    if (lastHide) list.push("hide");
    return list.join(" ");
  }, [className, lastHide]);
  return (
    <div {...props} className={className}>
      {list.map(({ id, name, element, currentMode }, i) => {
        return (
          <div
            key={`inPageMenu_${name}`}
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
              <span>{(name || id).toLocaleUpperCase()}</span>
            </div>
          </div>
        );
      })}
      <div className="background" />
    </div>
  );
}
