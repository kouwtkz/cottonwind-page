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

export function getCountList<T>(list: T[], field?: keyof T) {
  return (list as any[])
    .reduce<ValueCountType[]>((list, values) => {
      if (typeof values === "object" && field) {
        values = values[field];
      }
      if (!Array.isArray(values) && values !== null && typeof values !== "undefined") {
        values = [values];
      }
      values?.forEach((value: any) => {
        if (value) {
          const item = list.find((item: any) => item.value === value);
          if (item) item.count++;
          else list.push({ value, count: 1 });
        }
      })
      return list;
    }, [])
    .sort((a, b) => (a.value > b.value ? 1 : -1));
}

export function shuffleArray<T>(array: T[], clone = false) {
  const useArray = clone ? [...array] : array;
  for (let i = useArray.length - 1; i >= 0; i--) {
    let rand = Math.floor(Math.random() * (i + 1))
    let tmpStorage = useArray[i]
    useArray[i] = useArray[rand]
    useArray[rand] = tmpStorage
  }
  return useArray;
}

interface compareArrayOptionsType<T> {
  type?: "nomal";
  key?: keyof T;
}
export function compareArray<T>(array1: T[], array2: T[], { type = "nomal", key }: compareArrayOptionsType<T> = {}) {
  switch (type) {
    case "nomal":
      return array1.length === array2.length && array1.every(v1 => key ? array2.some(v2 => v1[key] === v2[key]) : array2.some(v2 => v1 === v2));
  }
}