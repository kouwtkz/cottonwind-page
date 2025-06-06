import type { ChangeEventHandler, ChangeEvent } from "react";
import type { ChangeHandler } from "react-hook-form";

export default function SetOnChange<T>(
  setOnChange: ChangeEventHandler<T>,
  hookOnChange: ChangeHandler
) {

  const f: ChangeEventHandler<T> = (e) => {
    setOnChange(e);
    hookOnChange(e);
  };
  return f;
}