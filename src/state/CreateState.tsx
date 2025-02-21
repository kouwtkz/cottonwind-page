import { create } from "zustand";

export type CreateStateFunctionType<T> = () => [
  T | undefined,
  React.Dispatch<React.SetStateAction<T>>
];
export function CreateState<T = unknown>(): CreateStateFunctionType<
  T | undefined
>;
export function CreateState<T = unknown>(value: T): CreateStateFunctionType<T>;

export function CreateState<T = unknown>(v?: T): CreateStateFunctionType<T> {
  const useState = create<{
    v: T | undefined;
    Set: React.Dispatch<React.SetStateAction<T>>;
  }>((set) => ({
    v,
    Set(v) {
      set((s) => {
        if (typeof v === "function") {
          return { v: (v as Function)(s.v) };
        } else return { v };
      });
      return v;
    },
  }));
  return () => {
    const state = useState();
    return [state.v, state.Set];
  };
}

export function CreateObjectState<T>(t: T) {
  type setType = (value: Partial<T> | ((prevState: T) => Partial<T>)) => void;
  const useState = create<T & { set: setType }>((Set) => ({
    ...t,
    set(v) {
      Set((s) => {
        if (typeof v === "function") {
          return (v as Function)(s);
        } else return v;
      });
      return v;
    },
  }));
  return () => {
    return useState();
  };
}
