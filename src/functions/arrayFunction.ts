import { sleep } from "./Time";

export function arrayPartition<T = unknown>(array: T[], partition: number) {
  return Array(Math.ceil(array.length / partition))
    .fill(null)
    .map((_, i) => array.slice(i * partition, (i + 1) * partition))
}

export interface PromiseOrderStateType {
  abort?: boolean;
  isAborted?: boolean;
}
interface PromiseOrderOptions {
  sleepTime?: number;
  minTime?: number;
  state?: PromiseOrderStateType;
  sync?: (i: number) => void;
}
export async function PromiseOrder<T = unknown>(list: (() => Promise<T>)[], { sleepTime, minTime, state, sync }: PromiseOrderOptions) {
  const results: T[] = [];
  if (state) state.isAborted = false;
  const max = list.length;
  for (let i = 0; i < max; i++) {
    if (sync) sync(i);
    const startTime = performance.now()
    results.push(await list[i]());
    const endTime = performance.now()
    if (minTime) {
      const SleepTime = minTime - (endTime - startTime);
      if (SleepTime > 0) await sleep(SleepTime);
    }
    if (sleepTime) await sleep(sleepTime);
    if (state) {
      if (state.abort && (i < max - 1)) {
        state.isAborted = true;
        break;
      }
    }
  }
  return results;
}