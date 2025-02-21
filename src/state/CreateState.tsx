import { create, StateCreator, StoreMutatorIdentifier } from "zustand";

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

type setType<T> = (value: Partial<T> | ((prevState: T) => Partial<T>)) => void;
type createType<T, Mos extends [StoreMutatorIdentifier, unknown][] = []> =
  | T
  | StateCreator<T, [], Mos>;
export function CreateObjectState<T>(t: createType<T>) {
  const useState = create<T & { set: setType<T> }>((Set) => {
    const _t = (typeof t === "function" ? (t as Function)(Set) : t);
    return {
      ..._t,
      set(v) {
        Set((s) => {
          if (typeof v === "function") {
            return (v as Function)(s);
          } else return v;
        });
        return v;
      },
    };
  });
  return () => useState();
}
