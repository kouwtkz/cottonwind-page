import { customFetch } from "~/components/functions/fetch";
import { ISOStringToZonedDateTime, siteTimeZone } from "~/components/functions/time/DateFunction";

const API_BASE = "https://www.googleapis.com/calendar/v3/calendars/";

interface eventsFetchProps {
  id: string;
  key: string;
  start?: Temporal.ZonedDateTime;
  end?: Temporal.ZonedDateTime;
  max?: number;
  single?: boolean;
  private?: boolean;
}
export async function eventsFetch({
  id,
  key,
  start,
  end,
  max = 9999,
  single = true,
  private: p = false
}: eventsFetchProps) {
  if (location.protocol !== "https:") return;
  const url = new URL(id + "/events", API_BASE);
  url.searchParams.set("key", key);
  if (start) url.searchParams.set("timeMin", start.toInstant().toString({ smallestUnit: "millisecond" }));
  if (end && (!start || Temporal.ZonedDateTime.compare(start, end) < 0))
    url.searchParams.set("timeMax", end.toInstant().toString());
  url.searchParams.set("singleEvents", String(single));
  url.searchParams.set("maxResults", String(max));
  return await customFetch(url.href)
    .then<EventsFetchedDataType>(async r => {
      if (r.status !== 200) throw r;
      return await r.json();
    })
    .then((data) => {
      const rawItems = data.items as unknown as EventsRawDataType[];
      data.items = rawItems.map((raw) => {
        const allDay = Boolean(raw.start.date);
        const start = raw.start.dateTime ? ISOStringToZonedDateTime(raw.start.dateTime) : raw.start.date ? Temporal.PlainDate.from(raw.start.date).toZonedDateTime(siteTimeZone) : Temporal.Now.zonedDateTimeISO(siteTimeZone);
        const end = raw.end.dateTime ? ISOStringToZonedDateTime(raw.end.dateTime) : raw.end.date ? Temporal.PlainDate.from(raw.end.date).toZonedDateTime(siteTimeZone) : Temporal.Now.zonedDateTimeISO(siteTimeZone);
        const duration = Math.ceil(
          (end.epochMilliseconds - start.epochMilliseconds) / 86400000,
        );

        return {
          id: raw.id,
          title: raw.summary,
          description: raw.description,
          location: raw.location,
          url: raw.htmlLink,
          attachments: raw.attachments,
          start,
          end,
          duration,
          allDay,
          raw,
          fetchData: data,
          private: p
        };
      });
      return data;
    })
    .catch(() => { });
}
