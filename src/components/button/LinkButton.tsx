import { HTMLAttributes, useMemo } from "react";

export function LinkButton({
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement>) {
  className = useMemo(() => {
    const list = ["link"];
    if (className) list.push(className);
    return list.join(" ");
  }, [className]);
  return <button type="button" className={className} {...props} />;
}
