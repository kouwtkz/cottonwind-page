import { RefCallback } from "react";

export default function SetRef<T>(
  setRef: React.MutableRefObject<T | null>,
  callbackRef: RefCallback<T>
) {
  return (e: T | null) => {
    callbackRef(e);
    setRef.current = e;
  };
}