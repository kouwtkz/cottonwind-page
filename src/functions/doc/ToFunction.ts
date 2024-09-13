export function BooleanToNumber(value?: boolean | null) {
  return typeof value === "boolean" ? (value ? 1 : 0) : undefined;
}

export function KeyValueToString(value: KeyValueType<unknown> | KeyValueType<unknown>[]) {
  (Array.isArray(value) ? value : [value])
    .forEach((entry) => {
      Object.keys(entry).forEach(k => {
        if (Array.isArray(entry[k]))
          entry[k] = entry[k].map(v => String(v)).join(",")
        else {
          const type = typeof entry[k];
          if (type === "object" && entry[k] !== null)
            entry[k] = JSON.stringify(entry[k])
        }
      })
    })
}

export function lastModToUniqueNow(value: KeyValueType<unknown> | KeyValueType<unknown>[], lastmod = "lastmod") {
  const now = new Date();
  (Array.isArray(value) ? value : [value]).forEach((entry) => {
    entry.lastmod = now.toISOString();
    now.setMilliseconds(now.getMilliseconds() + 1);
  })
}

export function unknownToString(value: unknown) {
  return value && typeof value === "string" ? value : undefined;
}
