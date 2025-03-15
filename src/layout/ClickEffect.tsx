import { ShortStocks } from "@/components/hook/ShortStocks";
import { useClickEvent } from "@/components/hook/useClickEvent";
import { HTMLAttributes, useMemo } from "react";

interface ClickEffectProps extends HTMLAttributes<HTMLDivElement> {
  timeout?: number;
}
export function ClickEffect({
  timeout = 500,
  className,
  style,
  ...props
}: ClickEffectProps) {
  const { x, y, timeStamp } = useClickEvent();
  const _className = useMemo(() => {
    const classNames = ["clickEffect"];
    if (className) classNames.push(className);
    return classNames.join(" ");
  }, [className]);
  const _style: React.CSSProperties = useMemo(
    () => ({
      top: `${y}px`,
      left: `${x}px`,
      animationDuration: `${timeout}ms`,
      ...style,
    }),
    [x, y, timeout, style]
  );
  return (
    <ShortStocks className="clickEffects" timeout={timeout}>
      {timeStamp ? (
        <div key={timeStamp} className={_className} style={_style} {...props} />
      ) : null}
    </ShortStocks>
  );
}

export function SimpleClickEffect() {
  return <ClickEffect className="simpleClick" />;
}
export function FluffClick() {
  return <ClickEffect className="simpleClick fluffClick" />;
}
