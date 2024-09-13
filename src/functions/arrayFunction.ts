import { sleep } from "./Time";

export function arrayPartition<T = unknown>(array: T[], partition: number) {
  return Array(Math.ceil(array.length / partition))
    .fill(null)
    .map((_, i) => array.slice(i * partition, (i + 1) * partition))
}

export async function PromiseOrder<T = unknown>(list: (() => Promise<T>)[], interval?: number) {
  const results: T[] = [];
  for (let i = 0; i < list.length; i++) {
    results.push(await list[i]());
    if (interval) await sleep(interval);
  }
  return results;
}