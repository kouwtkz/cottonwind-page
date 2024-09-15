export function setPrefix(key: string, prefix?: string, separator = "-") {
  return prefix ? prefix + separator + key : key;
}

export function setSuffix(key: string, suffix?: string, separator = "-") {
  return suffix ? key + separator + suffix : key;
}

export function getDataWithoutPrefix<T = string>(prefix: string, query: KeyValueType<T>, separator = "-") {
  const startsWithKey = prefix + separator;
  return Object.fromEntries(
    Object.entries(query)
      .filter(([k]) => k.startsWith(startsWithKey))
      .map(([k, v]) => ([k.slice(startsWithKey.length), v]))
  )
}
