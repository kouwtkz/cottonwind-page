export function setPrefix(key: string, prefix?: string) {
  return prefix ? prefix + "-" + key : key;
}

export function getDataWithoutPrefix<T = string>(prefix: string, query: KeyValueType<T>) {
  const startsWithKey = prefix + "-";
  return Object.fromEntries(
    Object.entries(query)
      .filter(([k]) => k.startsWith(startsWithKey))
      .map(([k, v]) => ([k.slice(startsWithKey.length), v]))
  )
}
