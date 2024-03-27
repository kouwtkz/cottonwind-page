import { RefObject, useEffect, useState } from "react";
import useScroll from "../hook/useScroll";
import TriangleCursor from "../svg/cursor/Triangle";

type InPageRefObject = {
  name: string;
  ref: RefObject<HTMLElement>;
};

export default function InPageMenu({
  list = [],
  firstTopRef,
  adjust = 16,
  lastAdjust = 8,
}: {
  list?: InPageRefObject[];
  firstTopRef?: RefObject<HTMLElement>;
  adjust?: number;
  lastAdjust?: number;
}) {
  const [refPrompt, setRefPrompt] = useState(false);
  useEffect(() => {
    if (refPrompt && list.some(({ ref }) => ref.current)) {
      setRefPrompt(false);
    }
  }, [refPrompt, list]);
  const { y, h, wh } = useScroll();
  const jy = y + adjust;
  const isLastScroll = h - y - lastAdjust <= wh;
  const firstTop =
    list.length > 0 ? (firstTopRef || list[0].ref)?.current?.offsetTop || 0 : 0;
  const filterList = list
    .filter(({ ref }) => {
      if (!refPrompt && !ref.current) setRefPrompt(true);
      return (ref.current?.children.length || 0) !== 0;
    })
    .map((item) => {
      const elm = item.ref.current;
      const top = (elm?.offsetTop || 0) - firstTop;
      return { ...item, elm, currentMode: top <= jy };
    });
  if (filterList.length > 0 && isLastScroll)
    filterList[filterList.length - 1].currentMode = true;
  const lastIndexCm = filterList.findLastIndex(
    ({ currentMode }) => currentMode
  );
  filterList.forEach((item, i) => {
    item.currentMode = i === lastIndexCm;
  });
  return (
    <div className="InPageMenu">
      {filterList.map(({ name, elm, currentMode }, i) => {
        return (
          <div
            key={i}
            className={"item" + (currentMode ? " current" : "")}
            onClick={() => {
              const top = (elm?.offsetTop || 0) - firstTop;
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
}
