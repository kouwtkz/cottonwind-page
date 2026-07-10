import { ShortStocks } from "~/components/hook/ShortStocks";
import { useClickEvent } from "~/components/click/useClickEvent";
import {
  type HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { CreateState } from "~/components/state/CreateState";
import { getCookies, removeCookie, setCookie } from "../theme/ThemeSetter";

const ClickEffectSrcList = [
  "/static/images/effect/cotton.webp",
  "/static/images/effect/leaf.webp",
];
export function ClickEffect() {
  function getImgSource() {
    return ClickEffectSrcList[
      Math.floor(Math.random() * ClickEffectSrcList.length)
    ];
  }
  function makeChild(array: number[]) {
    const rnd = Math.random();
    return array
      .filter((v, i) => Math.floor(rnd * 3) === i)
      .map((v, i) => {
        const rotate = Math.floor(Math.random() * 360);
        return (
          <div key={i} className={`d-${v * 30}`}>
            <img
              style={{
                transform: `rotate(${rotate}deg)`,
              }}
              src={getImgSource()}
            />
          </div>
        );
      });
  }
  const callback = useCallback(() => {
    const c1 = makeChild([11, 0, 1]);
    const c2 = makeChild([2, 3, 4]);
    const c3 = makeChild([5, 6, 7]);
    const c4 = makeChild([8, 9, 10]);
    return (
      <>
        {c1}
        {c2}
        {c3}
        {c4}
      </>
    );
  }, []);
  return (
    <>
      <ClickEffectState />
      <ClickEffectElement effectName="spread" callback={callback} />
    </>
  );
}

const cookieKey = import.meta.env.VITE_CLICK_EFFECT_KEY;
function ClickEffectState() {
  const [enableClickEffect, setClickEffect] = useClickEffect();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      if (!enableClickEffect) {
        const cookie = getCookies();
        if (cookie[cookieKey]) {
          setClickEffect(true);
          return;
        }
      }
      first.current = false;
      return;
    }
    if (enableClickEffect) {
      setCookie({
        key: cookieKey,
        value: "on",
        options: {
          maxAge: 34e6,
          path: "/",
        },
      });
    } else {
      removeCookie({ key: cookieKey, options: { path: "/" } });
    }
  }, [enableClickEffect]);
  return <></>;
}

const useClickEffect = CreateState(false);
type effectNameType = "spread";
interface ClickEffectProps extends HTMLAttributes<HTMLDivElement> {
  effectName?: effectNameType;
  timeout?: number;
  callback?(): React.ReactNode;
}
export function ClickEffectElement({
  timeout = 500,
  className,
  effectName,
  style,
  children,
  callback,
  ...props
}: ClickEffectProps) {
  const beforeTimeStamp = useRef(0);
  const clickEvent = useClickEvent();
  const { x, y, timeStamp } = clickEvent;
  const [isClickEffect] = useClickEffect();
  const isNewEvent = useMemo(() => {
    const before = beforeTimeStamp.current;
    beforeTimeStamp.current = timeStamp;
    return isClickEffect && before !== timeStamp;
  }, [timeStamp, isClickEffect]);
  const enableClickEffect = useMemo(
    () => isClickEffect && isNewEvent,
    [isClickEffect, isNewEvent],
  );
  className = useMemo(() => {
    const classNames = ["clickEffect"];
    if (className) classNames.push(className);
    if (effectName) classNames.push(effectName);
    if (!(callback || children)) classNames.push("blank");
    return classNames.join(" ");
  }, [className, effectName, callback, children]);
  style = useMemo(
    () =>
      enableClickEffect
        ? ({
            top: `${y}px`,
            left: `${x}px`,
            animationDuration: `${timeout}ms`,
            ...style,
          } as React.CSSProperties)
        : style,
    [enableClickEffect, x, y, timeout, style],
  );
  children = useMemo(
    () =>
      enableClickEffect && timeStamp ? (
        <div key={timeStamp} className={className} style={style} {...props}>
          {callback ? callback() : children}
        </div>
      ) : null,
    [enableClickEffect, timeStamp, className, style, children, callback, props],
  );
  return (
    <ShortStocks className="clickEffects" timeout={timeout}>
      {children}
    </ShortStocks>
  );
}

export function ClickEffectSwitchButton({
  children,
  className,
  title = "マウスエフェクト切り替え",
  "aria-label": ariaLabel = "switch",
  ...args
}: React.HTMLAttributes<HTMLButtonElement>) {
  const [enableClickEffect, setClickEffect] = useClickEffect();
  className = useMemo(() => {
    const classNames = ["clickEffect switch item"];
    if (className) classNames.push(className);
    if (!enableClickEffect) classNames.push("disabled");
    return classNames.join(" ");
  }, [className, enableClickEffect]);
  children = useMemo(
    () =>
      children ?? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 18 20"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12.04,20.17l-1.36-5.07M10.68,15.1l-2.51,2.23.57-9.47,5.23,7.92s-3.29-.67-3.29-.67Z"
            />
            <g>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.17,14.83C-.06,11.61-.06,6.39,3.17,3.17c3.22-3.22,8.45-3.22,11.67,0,1.55,1.55,2.42,3.65,2.42,5.83"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.29,12.71c-2.05-2.05-2.05-5.37,0-7.42,2.05-2.05,5.37-2.05,7.42,0,.98.98,1.54,2.32,1.54,3.71"
              />
            </g>
          </svg>
        </>
      ),
    [children],
  );
  return (
    <button
      {...args}
      className={className}
      aria-label={ariaLabel}
      title={title}
      onClick={useCallback(() => {
        setClickEffect((v) => !v);
      }, [])}
    >
      {children}
    </button>
  );
}
