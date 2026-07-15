import { useEffect, useMemo, useState } from "react";
import { useWindowSize } from "../hook/useWindowSize";
import { useWindowScroll } from "~/components/hook/useScroll";
import TriangleCursor from "~/components/svg/cursor/Triangle";
import { useWindowScrollSize } from "../hook/useScrollSize";

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
  autoLastHide = 4,
  translate = "no",
  className,
  ...props
}: InPageMenuProps) {
  const wh = useWindowSize()[0][1];
  const h = useWindowScrollSize()[0][1];
  const y = useWindowScroll()[0][1];
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
    <div {...props} className={className} translate={translate}>
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
