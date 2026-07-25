export function BooleanToNumber(value?: boolean | null) {
  return typeof value === "boolean" ? (value ? 1 : 0) : undefined;
}

export function KeyValueConvertDBEntry(value: Object | Object[]) {
  const _v = value as KeyValueType<unknown> | KeyValueType<unknown>[];
  (Array.isArray(_v) ? _v : [_v])
    .forEach((entry) => {
      Object.keys(entry).forEach(k => {
        if (Array.isArray(entry[k]))
          entry[k] = entry[k].length > 0 ? entry[k].map(v => String(v)).join(",") : null;
        else {
          const type = typeof entry[k];
          if (type === "boolean")
            entry[k] = entry[k] ? 1 : 0;
          else if (type === "object" && entry[k] !== null)
            entry[k] = JSON.stringify(entry[k]);
        }
      })
      deleteUndefined(entry);
    })
}

export function deleteUndefined(object: Object) {
  const _o = object as KeyValueType;
  if (object) Object.keys(object).forEach(k => {
    if (typeof _o[k] === "undefined") delete _o[k];
  });
  return _o;
}

export function lastModToUniqueNow(value: KeyValueType<unknown> | KeyValueType<unknown>[], lastmod = "lastmod") {
  let now = Temporal.Now.instant();
  (Array.isArray(value) ? value : [value]).forEach((entry) => {
    entry[lastmod] = now.toString({ smallestUnit: "millisecond" })
    now = now.add({ milliseconds: 1 });
  })
}

export function unknownToString(value: unknown) {
  return value && typeof value === "string" ? value : undefined;
}
