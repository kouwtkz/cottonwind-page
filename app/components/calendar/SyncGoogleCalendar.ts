const API_BASE = "https://www.googleapis.com/calendar/v3/calendars/";

interface eventsFetchProps {
  id: string;
  key: string;
  start?: Date;
  end?: Date;
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
  const url = new URL(id + "/events", API_BASE);
  url.searchParams.set("key", key);
  if (start) url.searchParams.set("timeMin", start.toISOString());
  if (end && (!start || start.getTime() < end.getTime()))
    url.searchParams.set("timeMax", end.toISOString());
  url.searchParams.set("singleEvents", String(single));
  url.searchParams.set("maxResults", String(max));
  return await fetch(url.href)
    .then<EventsFetchedDataType>(async r => {
      if (r.status !== 200) throw r;
      return await r.json();
    })
    .then((data) => {
      const rawItems = data.items as unknown as EventsRawDataType[];
      data.items = rawItems.map((raw) => {
        const allDay = Boolean(raw.start.date);
        const start = new Date(raw.start.dateTime || raw.start.date + " 00:00");
        const end = new Date(raw.end.dateTime || raw.end.date + " 00:00");
        return {
          id: raw.id,
          title: raw.summary,
          description: raw.description,
          location: raw.location,
          url: raw.htmlLink,
          start,
          end,
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
