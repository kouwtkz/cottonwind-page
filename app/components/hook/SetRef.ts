import type { RefCallback } from "react";
import type { FieldPath, FieldValues, UseFormRegisterReturn } from "react-hook-form";

export default function SetRef<T>(
  setRef: React.MutableRefObject<T | null>,
  callbackRef: RefCallback<T>
) {
  return (e: T | null) => {
    callbackRef(e);
    setRef.current = e;
  };
}

export type registerValue<TFieldValues extends FieldValues = FieldValues> = UseFormRegisterReturn<FieldPath<TFieldValues>>;

export interface registerRefProps<E = any, TFieldValues extends FieldValues = FieldValues> {
  useRefValue: React.RefObject<E | undefined>;
  registerValue: registerValue<TFieldValues>;
}
export function RegisterRef<E = any, TFieldValues extends FieldValues = FieldValues>({ useRefValue, registerValue }: registerRefProps<E, TFieldValues>) {
  const { ref: setRef, ...registered } = registerValue;
  const refPassthrough = (el: E) => {
    setRef(el);
    useRefValue.current = el;
  };
  return { refPassthrough, registered };
}
