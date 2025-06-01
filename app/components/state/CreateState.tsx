import {
  create,
  type StateCreator,
  type StoreMutatorIdentifier,
} from "zustand";

type SetStateAction<S> = S | ((prevState: S) => S);
type Dispatch<A> = (value: A) => void;
type SetStateActionOptional<S> = S | ((prevState?: S) => S);
type DispatchOptional<A> = (value?: A) => void;
export type CreateStateFunctionType<T> = () => [
  T | undefined,
  Dispatch<SetStateAction<T>>
];
type CreateStateFunctionOptionalType<T> = () => [
  T | undefined,
  DispatchOptional<SetStateActionOptional<T>>
];

export function CreateState<T = unknown>(): CreateStateFunctionOptionalType<T>;
export function CreateState<T = unknown>(value: T): CreateStateFunctionType<T>;

export function CreateState<T = unknown>(v?: T): CreateStateFunctionType<T> {
  const useState = create<{
    v: T | undefined;
    Set: Dispatch<SetStateAction<T>>;
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
export type setTypeProps<T> =
  | Partial<T>
  | ((prevState: T) => Partial<T> | void);
type setType<T> = (value: setTypeProps<T>) => void;
type createType<T, Mos extends [StoreMutatorIdentifier, unknown][] = []> =
  | T
  | StateCreator<T, [], Mos>;
type WithSet<T> = T & { Set: setType<T> };

export function CreateObjectState<T extends object>(
  t: createType<T> = {} as T
) {
  return create<WithSet<T>>((set, e) => {
    const _t = typeof t === "function" ? (t as Function)(set) : t;
    return {
      Set(v) {
        set((s) => {
          if (typeof v === "function") {
            return (v as Function)(s, e) || {};
          } else return v;
        });
      },
      ..._t,
    };
  });
}
