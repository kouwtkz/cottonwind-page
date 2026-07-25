export function autoPostId() {
  const now = Temporal.Now.instant();
  const days = Math.floor(
    (now.epochMilliseconds - Temporal.Instant.from("2000-01-01T00:00:00.000Z").epochMilliseconds) / 86400000
  );
  const todayBegin = Temporal.Now.plainDateISO().toZonedDateTime("UTC");
  return (
    days.toString(32) +
    ("0000" + (now.epochMilliseconds - todayBegin.epochMilliseconds).toString(30)).slice(-4)
  );
}
