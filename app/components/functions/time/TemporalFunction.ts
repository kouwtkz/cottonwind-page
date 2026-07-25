export function StrToInstant(value: string) {
  return Temporal.Instant.fromEpochMilliseconds(
    new Date(value).getTime(),
  )
}

export function StrToISOString(value: string) {
  return StrToInstant(value).toString({ smallestUnit: "millisecond" })
}

