export function arrayPartition<T = unknown>(array: T[], partition: number) {
  return Array(Math.ceil(array.length / partition))
    .fill(null)
    .map((_, i) => array.slice(i * partition, (i + 1) * partition))
}
