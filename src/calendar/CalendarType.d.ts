type GoogleCalendarOptionsType = {
  apiKey: string;
  calendarId: string;
}

interface CalendarIdListType {
  id: string;
  private?: boolean;
}

interface CalendarListType extends Partial<CalendarIdListType> {
  list?: EventsDataType[];
}

interface EventsDataType {
  title?: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  id: string;
  allDay?: boolean;
  url?: string;
  raw?: EventsRawDataType;
  fetchData?: EventsFetchedDataType;
  private?: boolean;
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

interface CalendarMeeEventSubComponentProps {
  event: EventsDataType;
}

interface CalendarMeeEventViewerProps {
  enableMarkdownCopy?: boolean;
  SubComponent?: (props: CalendarMeeEventSubComponentProps) => React.ReactNode;
  viewerClassName?: string;
}

interface CalendarMeeOverWriteOption {
  syncOverwrite: boolean;
  eventsOverwrite: boolean;
}
type timeRangesType = { start: Date; end: Date };

interface CalendarMeeStateType extends CalendarMeeOverWriteOption {
  events: EventsDataType[];
  add: EventsDataType[];
  eventsMap: Map<string, EventsDataType>;
  eventId: string | null;
  isOpenEvent: boolean;
  calendarList: CalendarListType[];
  stateLock: boolean;
  view: Type_VIEW_FC | null;
  date: Date;
  dateLock: boolean;
  timeRanges: timeRangesType[];
  getRange: timeRangesType | null;
  syncRange: timeRangesType | null;
  syncOverwrite: boolean;
  eventsOverwrite: boolean;
  setTimeRanges: (range: timeRangesType) => void;
  reload: (props: CalendarMeeReloadProps) => void
  isLoading: boolean;
  enableCountdown: boolean;
}
interface CalendarMeeReloadProps extends Partial<CalendarMeeOverWriteOption>, Partial<timeRangesType> {
  eventClose?: boolean;
}

interface CalendarAppClassType {
  events?: EventsDataType[];
  googleApiKey?: string | null;
  googleCalendarId?: CalendarIdListType[];
  defaultView?: string | null;
}
interface CalendarAppClassTypeWithMap extends CalendarAppClassType {
  eventsMap: Map<string, EventsDataType>;
}

interface CalendarAppStateSaveProps
  extends Omit<CalendarAppClassType, "googleCalendarId"> {
  event?: Partial<EventsDataType>;
  googleCalendarId?: CalendarIdListType | CalendarIdListType[];
  overwrite?: boolean;
  eventsMap?: Map<string, EventsDataType>;
}

interface CalendarAppStateType extends CalendarAppClassType {
  isEdit: boolean;
  edit: EventsDataType | null;
  eventsMap: Map<string, EventsDataType>;
  save: (props?: CalendarAppStateSaveProps) => void;
  removeEvent: (id: string) => void;
  addEventsEdit: (date?: Date) => void;
}
