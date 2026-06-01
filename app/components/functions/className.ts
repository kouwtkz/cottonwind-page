import { useMemo } from "react";

export function DefaultClassNameMemo(className?: string) {
  return useMemo(() => {
    const classNames: string[] = [];
    if (className) classNames.push(className);
    return classNames.join(" ");
  }, [className]);
}