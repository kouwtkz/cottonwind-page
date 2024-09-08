export function BooleanToNumber(value?: boolean | null) {
  return typeof value === "boolean" ? (value ? 1 : 0) : undefined;
}

export function KeyValueToString(value: KeyValueType<unknown> | KeyValueType<unknown>[]) {
  (Array.isArray(value) ? value : [value])
    .forEach(entry => {
      Object.keys(entry).forEach(k => {
        if (Array.isArray(entry[k]))
          entry[k] = entry[k].map(v => String(v)).join(",")
        else {
          const type = typeof entry[k];
          if (type === "object")
            entry[k] = JSON.stringify(entry[k])
        }
      })
    })
}

export function unknownToString(value: unknown) {
  return value && typeof value === "string" ? value : undefined;
}
