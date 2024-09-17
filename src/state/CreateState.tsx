import { atom, PrimitiveAtom, useAtom } from "jotai";
import { SetStateAction } from "react";

export type CreateStateFunctionType<T> = (() => [
  Awaited<T>,
  SetAtom<[SetStateAction<T>], void>
]) & {
  atom?: PrimitiveAtom<T>;
};
type SetAtom<Args extends unknown[], Result> = (...args: Args) => Result;

export function CreateState<T = unknown>(): CreateStateFunctionType<
  T | undefined
>;
export function CreateState<T = unknown>(value: T): CreateStateFunctionType<T>;
export function CreateState<T = unknown>(value?: T) {
  const atomValue = atom(value);
  const f: CreateStateFunctionType<T | undefined> = () => useAtom(atomValue);
  f.atom = atomValue;
  return f;
}
