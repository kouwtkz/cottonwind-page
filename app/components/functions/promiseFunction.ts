import { Sleep } from "./Sleep";

export interface PromiseOrderStateType {
  abort?: boolean;
  isAborted?: boolean;
}
export interface PromiseOrderOptions {
  sleepTime?: number;
  minTime?: number;
  state?: PromiseOrderStateType;
  sync?: (i: number) => void;
}
export async function PromiseOrder<T = unknown>(list: (() => Promise<T>)[], { sleepTime, minTime, state, sync }: PromiseOrderOptions = {}) {
  const results: T[] = [];
  if (state) state.isAborted = false;
  const max = list.length;
  for (let i = 0; i < max; i++) {
    if (sync) sync(i);
    const startTime = performance.now();
    results.push(await list[i]());
    const endTime = performance.now();
    if (minTime) {
      const SleepTime = minTime - (endTime - startTime);
      if (SleepTime > 0) await Sleep(SleepTime);
    }
    if (sleepTime) await Sleep(sleepTime);
    if (state) {
      if (state.abort && (i < max - 1)) {
        state.isAborted = true;
        break;
      }
    }
  }
  return results;
}