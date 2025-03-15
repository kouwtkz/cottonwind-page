import { HTMLAttributes, Key, useEffect, useMemo, useState } from "react";

export interface ShortStocksProps extends HTMLAttributes<HTMLDivElement> {
  timeout?: number;
}
type childType = { props: HTMLAttributes<any>; key?: Key };
export function ShortStocks({
  timeout = 1000,
  children,
  ...props
}: ShortStocksProps) {
  const childrenMap = useMemo(() => new Map<Key, childType>(), []);
  const [childrenState, setChildrenState] = useState<childType[] | null>(null);
  const childrens: childType[] = useMemo(
    () =>
      (Array.isArray(children) ? children : [children]).filter(
        (e) => e && typeof e === "object"
      ),
    [children]
  );
  useEffect(() => {
    childrens.forEach((v) => {
      if (v.key && !childrenMap.has(v.key)) {
        const key = v.key;
        childrenMap.set(key, v);
        setTimeout(() => {
          childrenMap.delete(key);
          setChildrenState(Object.values(Object.fromEntries(childrenMap)));
        }, timeout);
      }
    });
    setChildrenState(Object.values(Object.fromEntries(childrenMap)));
  }, [childrens, timeout]);
  return <div {...props}>{childrenState as React.ReactNode}</div>;
}
