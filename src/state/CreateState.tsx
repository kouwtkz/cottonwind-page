import { create } from "zustand";

export type CreateStateFunctionType<T> = () => [T | undefined, (t?: T) => void];
export function CreateState<T = unknown>(): CreateStateFunctionType<
  T | undefined
>;
export function CreateState<T = unknown>(value: T): CreateStateFunctionType<T>;

export function CreateState<T = unknown>(v?: T): CreateStateFunctionType<T> {
  const useState = create<{ v: T | undefined; Set: (v?: T) => void }>(
    (set) => ({
      v,
      Set(v) {
        set({ v });
      },
    })
  );
  return () => {
    const state = useState();
    return [state.v, state.Set];
  };
}
