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

interface EventsDataType {
  title?: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  id: string;
  allDay: boolean;
  url: string;
  raw?: EventsRawDataType;
}

type EventsRawDateType = { date?: string; dateTime?: string; timeZone?: string };

interface EventsRawDataType {
  created: string;
  creator: { email: string };
  description: string;
  end: EventsRawDateType;
  etag: string;
  eventType: string;
  htmlLink: string;
  iCalUID: string;
  id: string;
  kind: string;
  location: string;
  organizer: { email: string; displayName: string; self: boolean };
  sequence: number;
  start: EventsRawDateType;
  status: string;
  summary: string;
  transparency: string;
  updated: string;
  visibility: string;
}

interface EventsFetchedDataType {
  accessRole: string;
  defaultReminders: any[];
  description: string;
  etag: string;
  items: EventsDataType[];
  kind: string;
  nextSyncToken: string;
  summary: string;
  timeZone: string;
  updated: string;
}
