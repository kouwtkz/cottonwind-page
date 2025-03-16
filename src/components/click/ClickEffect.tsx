import { ShortStocks } from "@/components/hook/ShortStocks";
import { useClickEvent } from "@/components/click/useClickEvent";
import { HTMLAttributes, useCallback, useMemo, useRef, useState } from "react";
import { CreateState } from "@/state/CreateState";

export function ClickEffect() {
  return <ClickEffectElement effectName="spread"></ClickEffectElement>;
}

const useClickEffect = CreateState(false);
type effectNameType = "spread";
interface ClickEffectProps extends HTMLAttributes<HTMLDivElement> {
  effectName?: effectNameType;
  timeout?: number;
}
export function ClickEffectElement({
  timeout = 500,
  className,
  effectName,
  style,
  children,
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
    [isClickEffect, isNewEvent]
  );
  className = useMemo(() => {
    const classNames = ["clickEffect"];
    if (className) classNames.push(className);
    if (effectName) classNames.push(effectName);
    if (!children) classNames.push("blank");
    return classNames.join(" ");
  }, [className, effectName, children]);
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
    [enableClickEffect, x, y, timeout, style]
  );
  children = useMemo(
    () =>
      enableClickEffect && timeStamp ? (
        <div key={timeStamp} className={className} style={style} {...props}>
          {children}
        </div>
      ) : null,
    [enableClickEffect, timeStamp, className, style, children, props]
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
    [children]
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
