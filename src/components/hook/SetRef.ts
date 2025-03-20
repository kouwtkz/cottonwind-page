import { RefCallback } from "react";
import { FieldPath, FieldValues, UseFormRegisterReturn } from "react-hook-form";

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

export interface registerRefProps<E extends Node, TFieldValues extends FieldValues = FieldValues> {
  useRefValue: React.MutableRefObject<E | undefined>;
  registerValue: registerValue<TFieldValues>;
}
export function RegisterRef<E extends Node, TFieldValues extends FieldValues = FieldValues>({ useRefValue, registerValue }: registerRefProps<E, TFieldValues>) {
  const { ref: setRef, ...registered } = registerValue;
  const refPassthrough = (el: E) => {
    setRef(el);
    useRefValue.current = el;
  };
  return { refPassthrough, registered };
}
