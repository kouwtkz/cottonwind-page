type GoogleCalendarOptionsType = {
  apiKey: string;
  calendarId: string;
}

type eventsItemType = {
  title: string;
  start: string;
  end: string;
  constraint: string;
}

type calendarModeType = "agenda" | "month" | "day";
type calendarViewType = "dayGridMonth" | "listWeek" | "dayGridDay";
