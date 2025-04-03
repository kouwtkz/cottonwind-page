import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import allLocales from "@fullcalendar/core/locales-all";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  DatesSetArg,
  EventClickArg,
  formatDate,
  FormatDateOptions,
  FormatterInput,
} from "@fullcalendar/core/index.js";
import {
  SetURLSearchParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { strToNumWithNull } from "@/functions/strTo";
import { Modal } from "@/layout/Modal";
import { MultiParserWithMedia as MultiParser } from "@/components/parse/MultiParserWithMedia";
import {
  RiFileCopyLine,
  RiLink,
  RiMapPinLine,
  RiTimeLine,
} from "react-icons/ri";
import { defaultLang } from "@/multilingual/envDef";
import { CreateObjectState } from "@/state/CreateState";
import { CopyWithToast } from "@/functions/toastFunction";
import { eventsFetch } from "./SyncGoogleCalendar";
import { DateNotEqual, toDayStart } from "@/functions/DateFunction";
import { useNotification } from "@/state/NotificationState";

interface CustomFullCalendar extends Omit<FullCalendar, "calendar"> {
  calendar: Calendar;
}

const AGENDA_DAYS = 184;

const weekTitleFormat: FormatterInput = ({ start, end }) => {
  let useDate = end;
  // 今月の最終週のみ今月として表記
  if (start.month !== end?.month) {
    const current = new Date();
    if (
      current.getFullYear() === start.year &&
      current.getMonth() === start.month
    )
      useDate = start;
    start.day++;
  }
  if (!useDate) useDate = start;
  return (
    `${useDate.year}年${useDate.month + 1}月` +
    ` ${Math.ceil(useDate.day / 7)}週目`
  );
};

export const FC_SP_VIEW = "fc-view";
export const FC_SP_YEAR = "fc-year";
export const FC_SP_MONTH = "fc-month";
export const FC_SP_DAY = "fc-day";
export type Type_SP_FC =
  | typeof FC_SP_VIEW
  | typeof FC_SP_YEAR
  | typeof FC_SP_MONTH
  | typeof FC_SP_DAY;
export const FC_VIEW_AGENDA = "agenda";
export const FC_VIEW_WEEK = "week";
export const FC_VIEW_MONTH = "month";
export const FC_VIEW_DAY = "day";
export type Type_VIEW_FC =
  | typeof FC_VIEW_AGENDA
  | typeof FC_VIEW_WEEK
  | typeof FC_VIEW_MONTH
  | typeof FC_VIEW_DAY;
const FC_SP_EVENT_ID = "fc-event-id";
export const NOTICE_KEY_CALENDAR = "calendar";
export const NOTICE_KEY_COUNTDOWN = "countdown";

function openWindow(url: string) {
  window.open(url, "google-calendar-event", "width=700,height=600");
}

const defaultEnableCountdown = (() => {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.has("countdown");
})();

export const useCalendarMee = CreateObjectState<CalendarMeeStateType>(
  (set) => ({
    events: [],
    add: [],
    eventsMap: new Map(),
    eventId: null,
    isOpenEvent: false,
    calendarList: [],
    stateLock: false,
    view: null,
    date: dateFromSearchParams(new URLSearchParams(document.location.search)),
    dateLock: false,
    timeRanges: [],
    getRange: null,
    syncRange: null,
    syncOverwrite: true,
    eventsOverwrite: false,
    reload({ start, end, eventClose, ...props }) {
      set((state) => {
        const value: Partial<CalendarMeeStateType> = props;
        value.syncRange = state.timeRanges[0] || {
          start: state.date,
          end: state.date,
        };
        if (start) value.syncRange.start = start;
        if (end) value.syncRange.end = end;
        if (eventClose) value.eventId = null;
        return value;
      });
    },
    setTimeRanges(range) {
      set(({ timeRanges, syncRange, syncOverwrite }) => {
        if (syncOverwrite) timeRanges = [];
        syncRange = null;
        const startTime = range.start.getTime();
        const endTime = range.end.getTime();
        const exist = timeRanges.some((v) => {
          return v.start.getTime() <= startTime && endTime <= v.end.getTime();
        });
        if (!exist) syncRange = range;
        timeRanges.push(range);
        timeRanges.sort((a, b) => a.start.getTime() - b.start.getTime());
        timeRanges = timeRanges.reduce<timeRangesType[]>((a, c) => {
          if (a.length === 0) a.push(c);
          else {
            const p = a[a.length - 1];
            const pEndTime = p.end.getTime();
            if (pEndTime >= c.start.getTime()) {
              if (pEndTime < c.end.getTime()) p.end = c.end;
            } else {
              a.push(c);
            }
          }
          return a;
        }, []);
        return { timeRanges, syncRange, getRange: null };
      });
    },
    isLoading: false,
    enableCountdown: defaultEnableCountdown,
  })
);

function dateFromSearchParams(
  searchParams: URLSearchParams,
  date = new Date()
) {
  const newDate = new Date(date);
  if (searchParams.has(FC_SP_DAY)) {
    const day = strToNumWithNull(searchParams.get(FC_SP_DAY));
    if (day) newDate.setDate(day);
  }
  if (searchParams.has(FC_SP_MONTH)) {
    const month = strToNumWithNull(searchParams.get(FC_SP_MONTH));
    if (month) newDate.setMonth(month - 1);
  }
  if (searchParams.has(FC_SP_YEAR)) {
    const year = strToNumWithNull(searchParams.get(FC_SP_YEAR));
    if (year) newDate.setFullYear(year);
  }
  return newDate;
}

function setDateUrl(date: Date, setSearchParams: SetURLSearchParams) {
  const beforeSearch = location.search;
  const searchParams = new URLSearchParams(beforeSearch);
  const dateDiff = Math.abs(new Date().getTime() - date.getTime());
  if (dateDiff < 600000) {
    searchParams.delete(FC_SP_YEAR);
    searchParams.delete(FC_SP_MONTH);
    searchParams.delete(FC_SP_DAY);
  } else {
    searchParams.set(FC_SP_YEAR, date.getFullYear().toString());
    searchParams.set(FC_SP_MONTH, (date.getMonth() + 1).toString());
    searchParams.set(FC_SP_DAY, date.getDate().toString());
  }
  const afterSearch = (searchParams.size ? "?" : "") + searchParams.toString();
  if (beforeSearch !== afterSearch) {
    setSearchParams(searchParams, { preventScrollReset: true });
  }
  return afterSearch;
}

interface CalendarMeeStateProps extends CalendarMeeEventViewerProps {
  googleApiKey?: string | null;
  googleCalendarList?: (string | CalendarIdListType)[];
  events?: EventsDataType[];
  calendarList?: CalendarListType[];
}
export function CalendarMeeState({
  googleApiKey,
  googleCalendarList: propsGoogleCalendarList,
  events: propsEvents,
  calendarList: propsCalendarList,
  ...viewerProps
}: CalendarMeeStateProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventIdParam = useMemo(
    () => searchParams.get(FC_SP_EVENT_ID),
    [searchParams]
  );
  const {
    add,
    eventId,
    eventsMap,
    Set,
    stateLock,
    date,
    getRange,
    syncRange,
    setTimeRanges,
    dateLock,
    calendarList,
  } = useCalendarMee();
  useEffect(() => {
    if (add.length > 0) Set({ add: [] });
  }, [add]);
  const calendarDataList = useMemo(() => {
    const list: CalendarListType[] = [];
    propsCalendarList?.forEach((item) => {
      list.push(item);
    });
    propsGoogleCalendarList?.forEach((v) => {
      list.push(typeof v === "string" ? { id: v } : v);
    });
    if (propsEvents) list.push({ list: propsEvents });
    return list;
  }, [propsCalendarList, propsGoogleCalendarList, propsEvents]);
  useEffect(() => {
    Set({
      calendarList: calendarDataList,
    });
  }, [calendarDataList]);
  useEffect(() => {
    if (getRange && calendarList) setTimeRanges(getRange);
  }, [getRange, calendarList]);
  useEffect(() => {
    if (
      (googleApiKey || googleApiKey === null) &&
      syncRange &&
      calendarList.length > 0
    ) {
      Set({ isLoading: true });
      Promise.all(
        calendarList.map(async ({ id, private: p, list }) => {
          return id && googleApiKey
            ? eventsFetch({
                id,
                key: googleApiKey,
                start: syncRange.start,
                end: syncRange.end,
                private: p,
              }).then((data) => {
                return data.items;
              })
            : (async () => list || [])();
        })
      )
        .then((events) => {
          Set(({ eventsMap, syncOverwrite, eventsOverwrite }) => {
            if (syncOverwrite && eventsOverwrite) {
              eventsMap.clear();
            } else if (syncOverwrite || eventsOverwrite) {
              eventsMap.forEach((event, key) => {
                if (syncOverwrite ? event.raw : !event.raw)
                  eventsMap.delete(key);
              });
            }
            const add: EventsDataType[] = [];
            events.forEach((items) => {
              if (items && Array.isArray(items)) {
                items.forEach((item) => {
                  if (!eventsMap.has(item.id)) add.push(item);
                  eventsMap.set(item.id, item);
                });
              }
            });
            return {
              eventsMap,
              events: Object.values(Object.fromEntries(eventsMap)),
              add,
            };
          });
        })
        .finally(() => {
          Set({
            isLoading: false,
            syncRange: null,
            syncOverwrite: false,
            eventsOverwrite: false,
          });
        });
    }
  }, [googleApiKey, calendarList, syncRange, Set]);

  useEffect(() => {
    Set(({ date, dateLock }) => {
      if (!dateLock) {
        const newDate = dateFromSearchParams(searchParams);
        if (DateNotEqual(date, newDate)) {
          return { date: newDate, dateLock: true };
        }
      }
      return {};
    });
  }, [searchParams]);
  useEffect(() => {
    Set({ dateLock: false });
  }, [dateLock]);
  const view = useMemo(() => searchParams.get(FC_SP_VIEW), [searchParams]);
  useEffect(() => {
    if (eventId && view === FC_VIEW_DAY && !eventsMap.has(eventId)) {
      const dateString = formatDate(date, { dateStyle: "medium" });
      const start = new Date(dateString);
      const end = new Date(dateString + " 23:59:59");
      Set({ syncRange: { start, end } });
    }
  }, [view, eventId, eventsMap, date]);

  const { state } = useLocation();
  const nav = useNavigate();
  const setEventSearchParams = useCallback(
    (id: string | null) => {
      const searchParams = new URLSearchParams(location.search);
      if (id) {
        if (searchParams.get(FC_SP_EVENT_ID) !== id) {
          searchParams.set(FC_SP_EVENT_ID, id);
          setSearchParams(searchParams, {
            preventScrollReset: true,
            state: { ...(state || {}), from: location.href },
          });
        }
      } else {
        if (state?.from) nav(-1);
        else {
          searchParams.delete(FC_SP_EVENT_ID);
          setSearchParams(searchParams, {
            preventScrollReset: true,
          });
        }
      }
    },
    [state]
  );

  const setStateLock = useCallback((value: boolean) => {
    Set({ stateLock: value });
  }, []);
  const beforeEventId = useRef(eventId);
  const beforeEventIdParam = useRef<string | null>(null);
  useEffect(() => {
    if (stateLock) {
      setStateLock(false);
    } else {
      if (beforeEventId.current !== eventId) {
        setEventSearchParams(eventId);
        setStateLock(true);
      } else if (beforeEventIdParam.current !== eventIdParam) {
        Set({ eventId: eventIdParam, isOpenEvent: Boolean(eventIdParam) });
        setStateLock(true);
      }
    }
    beforeEventId.current = eventId;
    beforeEventIdParam.current = eventIdParam;
  }, [stateLock, eventId, eventIdParam]);

  return <CalendarMeeEventViewer {...viewerProps} />;
}

export interface CalendarMeeProps
  extends React.ImgHTMLAttributes<HTMLDivElement> {
  width?: number;
  height?: number;
  defaultView?: Type_VIEW_FC;
  visibleDateSet?: boolean;
  eventOpen?: (e: EventClickArg) => void | boolean;
  openAddEvents?: (ev: MouseEvent, element: HTMLElement) => void;
  openSetting?: (ev: MouseEvent, element: HTMLElement) => void;
}

export function CalendarMee({
  height,
  style = {},
  defaultView = FC_VIEW_MONTH,
  visibleDateSet,
  className,
  eventOpen: eventOpenProps,
  openAddEvents,
  openSetting,
  ...args
}: CalendarMeeProps) {
  className = useMemo(() => {
    const classNames: string[] = ["fc"];
    if (className) classNames.push(className);
    return classNames.join(" ");
  }, [className]);
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const { Set, eventId, events, date, isLoading } = useCalendarMee();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = useMemo(
    () => searchParams.get(FC_SP_VIEW) || defaultView,
    [searchParams, defaultView]
  ) as Type_VIEW_FC;
  const initialView = useMemo(() => view, []);
  const setView = useCallback(
    (view: Type_VIEW_FC) => {
      const beforeSearch = location.search;
      const searchParams = new URLSearchParams(beforeSearch);
      if (view === defaultView) searchParams.delete(FC_SP_VIEW);
      else if (view) {
        searchParams.set(FC_SP_VIEW, view);
      }
      const afterSearch =
        (searchParams.size ? "?" : "") + searchParams.toString();
      if (beforeSearch !== afterSearch) {
        setSearchParams(searchParams, { preventScrollReset: true });
      }
    },
    [defaultView]
  );
  useEffect(() => {
    Set({ view });
  }, [view]);
  const isChangeView = useRef(false);
  useEffect(() => {
    if (calendar && view && calendar.view.type !== view) {
      setTimeout(() => {
        isChangeView.current = true;
        calendar.changeView(view);
      }, 0);
    }
  }, [calendar, view]);

  const DateJumpButtonClick = useCallback(
    (e: MouseEvent) => {
      if (calendar) {
        const elm = e.target as HTMLInputElement;
        let c = elm.parentElement!.querySelector(
          "input#dateSelector"
        ) as HTMLInputElement | null;
        if (!c) {
          const nc = document.createElement("input");
          nc.type = "datetime-local";
          nc.id = "dateSelector";
          nc.onchange = () => {
            calendar.gotoDate(new Date(nc.value));
            nc.remove();
          };
          elm.after(nc as any);
        } else {
          c.remove();
        }
      }
    },
    [calendar]
  );
  const noEventsText = useMemo(() => {
    return isLoading
      ? "読み込み中…"
      : `この${view === "week" ? "週" : "期間"}はイベントはありません`;
  }, [isLoading, view]);
  if (height !== undefined) style.height = height;
  const EventToDayFunc = useCallback(
    (e: EventClickArg) => {
      if (calendar && e.event.start) {
        const localDate = new Date(e.event.start);
        calendar.gotoDate(localDate);
        calendar.changeView("day");
        (e.jsEvent.target as HTMLElement).blur();
        e.jsEvent.preventDefault();
      }
    },
    [calendar]
  );
  const onChangeHandle = useCallback(
    (arg: DatesSetArg) => {
      Set({ getRange: { start: arg.start, end: arg.end } });
      if (calendar) {
        if (isChangeView.current) {
          isChangeView.current = false;
        } else {
          setDateUrl(calendar.getDate(), setSearchParams);
          setView(calendar.view.type as Type_VIEW_FC);
        }
      }
    },
    [calendar, eventId]
  );
  const eventOpen = useCallback(
    (e: EventClickArg) => {
      if (!eventOpenProps || eventOpenProps(e)) {
        Set({ eventId: e.event.id, isOpenEvent: Boolean(e.event.id) });
      }
      e.jsEvent.preventDefault();
    },
    [eventOpenProps]
  );
  const headerToolbarEnd = useMemo(() => {
    const list: string[] = [];
    if (openSetting) list.push("openSetting");
    if (openAddEvents) list.push("openAddEvents");
    if (visibleDateSet) list.push("dateSet");
    list.push(`${FC_VIEW_MONTH},${FC_VIEW_WEEK},${FC_VIEW_AGENDA}`);
    list.push("prev,today,next");
    return list.join(" ");
  }, [visibleDateSet, openAddEvents, openSetting]);
  return (
    <div {...{ ...args, style, className }}>
      <FullCalendar
        height={height}
        ref={(e: any) => {
          const fullCalendar = e as CustomFullCalendar | null;
          if (fullCalendar) {
            if (calendar !== fullCalendar.calendar)
              setCalendar(fullCalendar.calendar);
          }
        }}
        lazyFetching
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
        locales={allLocales}
        events={events}
        dayCellContent={(e) => e.dayNumberText.replace("日", "")}
        dayMaxEvents={true}
        businessHours={true}
        navLinks={true}
        allDayText="終日"
        datesSet={onChangeHandle}
        eventContent={({ event, timeText, view }) => {
          let title = event._def.title;
          if (title === "undefined") title = "予定あり";
          let titleNode = <div className="fc-event-title">{title}</div>;
          switch (view.type as Type_VIEW_FC) {
            case "agenda":
            case "week":
              titleNode = <a href={event.url}>{titleNode}</a>;
              break;
          }
          if (timeText) {
            const timeNode = <div className="fc-event-time">{timeText}</div>;
            if (/^\d+\:/.test(timeText))
              return (
                <div className="fc-event-main-frame">
                  {timeNode}
                  {titleNode}
                </div>
              );
            else
              return (
                <>
                  <div className="fc-daygrid-event-dot" />
                  {timeNode}
                  {titleNode}
                </>
              );
          } else {
            return titleNode;
          }
        }}
        headerToolbar={{
          start: "title",
          end: headerToolbarEnd,
        }}
        moreLinkClick={(args) => {
          args.jsEvent.preventDefault();
        }}
        initialDate={date}
        initialView={initialView}
        locale={defaultLang}
        eventClick={eventOpen}
        buttonText={{
          today: "現在",
          [FC_VIEW_MONTH]: "月",
          [FC_VIEW_WEEK]: "週",
          [FC_VIEW_AGENDA]: "予定",
        }}
        customButtons={{
          dateSet: {
            text: "日時",
            click: DateJumpButtonClick,
          },
          openAddEvents: {
            text: "追加",
            click: openAddEvents,
          },
          openSetting: {
            text: "設定",
            click: openSetting,
          },
        }}
        views={{
          [FC_VIEW_AGENDA]: {
            type: "list",
            listDayFormat: {
              month: "numeric",
              day: "numeric",
              weekday: "narrow",
            },
            listDaySideFormat: false,
            duration: { days: AGENDA_DAYS },
          },
          [FC_VIEW_MONTH]: {
            type: "dayGridMonth",
          },
          listWeek: { titleFormat: weekTitleFormat },
          [FC_VIEW_WEEK]: {
            type: "listWeek",
            titleFormat: weekTitleFormat,
          },
          [FC_VIEW_DAY]: {
            type: "dayGridDay",
          },
        }}
        noEventsText={noEventsText}
      />
    </div>
  );
}

export function CalendarMeeEventViewer({
  enableMarkdownCopy,
  SubComponent,
  viewerClassName,
}: CalendarMeeEventViewerProps = {}) {
  const {
    Set,
    eventsMap,
    eventId: stateEventId,
    isOpenEvent,
    isLoading,
    enableCountdown,
  } = useCalendarMee();
  const keepId = useRef<string | null>(null);
  const eventId = useMemo(() => {
    if (stateEventId && isOpenEvent) {
      keepId.current = stateEventId;
    } else if (keepId.current) {
      const id = keepId.current;
      keepId.current = null;
      return id;
    }
    return stateEventId;
  }, [stateEventId, isOpenEvent]);
  const event = eventId ? eventsMap.get(eventId) : null;
  const location = event?.location;
  const startDate = event?.start;
  let endDate = event ? new Date(event.end) : null;
  const startDateString = useMemo(
    () =>
      startDate
        ? formatDate(startDate, {
            locale: defaultLang,
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "narrow",
          })
        : "",
    [startDate]
  );
  const startTimeString = useMemo(
    () =>
      startDate && !event.allDay
        ? formatDate(startDate, {
            locale: defaultLang,
            hour: "numeric",
            minute: "numeric",
          })
        : "",
    [startDate, event?.allDay]
  );
  const endDateString = useMemo(() => {
    const endFormat: FormatDateOptions = {
      locale: defaultLang,
    };
    function setEndDateFormat() {
      if (startDate!.getFullYear() !== endDate!.getFullYear()) {
        endFormat.year = "numeric";
      }
      if (endFormat.year || startDate!.getMonth() !== endDate!.getMonth()) {
        endFormat.month = "long";
      }
      if (endFormat.month || startDate!.getDate() !== endDate!.getDate()) {
        endFormat.day = "numeric";
        endFormat.weekday = "narrow";
      }
    }
    if (startDate && endDate) {
      if (event.allDay) {
        const sameDate = Math.floor(
          (endDate.getTime() - startDate.getTime()) / 86400000
        );
        if (sameDate < 2) {
          endDate = null;
        } else {
          endDate.setMilliseconds(-1);
          setEndDateFormat();
        }
      } else {
        setEndDateFormat();
      }
    } else return "";
    return endDate && (endFormat.year || endFormat.month || endFormat.day)
      ? formatDate(endDate, endFormat)
      : "";
  }, [startDate, endDate, event?.allDay]);
  const endTimeString = useMemo(
    () =>
      startDate && endDate && !event.allDay
        ? formatDate(endDate, {
            locale: defaultLang,
            hour: "numeric",
            minute: "numeric",
          })
        : "",
    [startDate, endDate, event?.allDay]
  );
  const ModalCloseHandler = useCallback(() => {
    Set({ isOpenEvent: false });
    keepId.current = null;
  }, []);

  const EventCloseHandler = useCallback(() => {
    Set({ eventId: null });
  }, []);

  const failEvent = useMemo(() => {
    return eventId && !isLoading && !event;
  }, [eventId, isLoading, event]);
  const isOpen = useMemo(() => {
    return isOpenEvent && !failEvent;
  }, [isOpenEvent, failEvent]);

  const BackgroundCalenderMee = useCallback(() => {
    return (
      <>{eventId && !event ? <CalendarMee className="background" /> : null}</>
    );
  }, [event, eventId]);
  const copyAction = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (eventId) {
        const searchParams = new URLSearchParams();
        searchParams.set(FC_SP_EVENT_ID, eventId);
        if (startDate) {
          searchParams.set(FC_SP_YEAR, startDate.getFullYear().toString());
          searchParams.set(FC_SP_MONTH, (startDate.getMonth() + 1).toString());
          searchParams.set(FC_SP_DAY, startDate.getDate().toString());
        }
        searchParams.set(FC_SP_VIEW, FC_VIEW_DAY);
        CopyWithToast(`[](??${searchParams})`);
      }
    },
    [eventId, startDate]
  );
  const { state } = useLocation();
  const setSearchParams = useSearchParams()[1];
  const setCountdown = useCallback(
    (v: boolean) => {
      const options = { state, preventScrollReset: true, replace: true };
      if (v && !enableCountdown) {
        Set({ enableCountdown: true });
        setSearchParams((searchParams) => {
          searchParams.set("countdown", "enable");
          return searchParams;
        }, options);
      } else if (!v && enableCountdown) {
        setSearchParams((searchParams) => {
          searchParams.delete("countdown");
          return searchParams;
        }, options);
        Set({ enableCountdown: false });
      }
    },
    [enableCountdown, state]
  );
  const timeClassName = useMemo(() => {
    const classNames = ["time"];
    if (enableCountdown) classNames.push("enableCountdown");
    if (endDateString) classNames.push("smaller");
    if (!(startTimeString || endTimeString)) classNames.push("single");
    return classNames.join(" ");
  }, [enableCountdown, startTimeString, endDateString, endTimeString]);
  const TitleTime = useMemo(() => {
    return endDateString ? (
      <>
        <span>{startDateString}</span>
        <span className="time">{startTimeString}</span>
        {endDate ? (
          <>
            <span className="during">-</span>
            <span>{endDateString}</span>
            <span className="time">{endTimeString}</span>
          </>
        ) : null}
      </>
    ) : (
      <>
        {startDateString}
        <span className="time">
          {startTimeString}
          {endTimeString ? (
            <>
              <span className="during">-</span>
              {endTimeString}
            </>
          ) : null}
        </span>
      </>
    );
  }, [startDateString, startTimeString, endDate, endDateString, endTimeString]);
  viewerClassName = useMemo(() => {
    const classList = ["middle"];
    if (viewerClassName) classList.push(viewerClassName);
    return classList.join(" ");
  }, [viewerClassName]);
  const { isEnable: _iENC, keyValues } = useNotification();
  const countdownNotification = useMemo(
    () => _iENC && Boolean(keyValues?.[NOTICE_KEY_COUNTDOWN]),
    [_iENC, keyValues]
  );
  return (
    <>
      <Modal
        className={viewerClassName}
        classNameEntire="fc"
        onClose={ModalCloseHandler}
        onExited={EventCloseHandler}
        isOpen={isOpen}
        timeout={60}
        scroll
      >
        {event ? (
          <>
            {SubComponent ? <SubComponent event={event} /> : null}
            <div className={timeClassName}>
              {startDate ? (
                <h3>
                  {event.url ? (
                    <a
                      className="time"
                      href={event.url}
                      target="google-calendar-event"
                    >
                      {TitleTime}
                    </a>
                  ) : (
                    <span className="time">{TitleTime}</span>
                  )}
                </h3>
              ) : null}
              {enableCountdown && startDate ? (
                <h4>
                  <CountDown
                    date={startDate}
                    end={endDate}
                    allDay={event.allDay}
                    title={event.title}
                    notification={countdownNotification}
                  />
                </h4>
              ) : null}
            </div>
            <div className="title">
              <h2>{event.title}</h2>
              <div>
                {enableMarkdownCopy && !event.private ? (
                  <button
                    title="ブログ用にコピーする"
                    type="button"
                    onClick={copyAction}
                  >
                    <RiFileCopyLine />
                  </button>
                ) : null}
                <button
                  title={
                    "カウントダウンを" +
                    (enableCountdown ? "しまう" : "表示する")
                  }
                  type="button"
                  onClick={() => setCountdown(!enableCountdown)}
                >
                  <RiTimeLine />
                </button>
              </div>
            </div>
            {location ? (
              <h5>
                {/^http.?:\/\//.test(location) ? (
                  <a href={location} target="_blank" title={location}>
                    <RiLink className="mr-1" />
                    <span>{location}</span>
                  </a>
                ) : (
                  <a
                    href={`https://www.google.com/maps/search/${location}`}
                    target="_blank"
                    title={location}
                  >
                    <RiMapPinLine className="mr-1" />
                    <span>{String(location).split(/, |\(|（/, 1)[0]}</span>
                  </a>
                )}
              </h5>
            ) : null}
            <div className="description">
              <MultiParser>{event.description}</MultiParser>
            </div>
          </>
        ) : (
          <div>読み込み中…</div>
        )}
      </Modal>
    </>
  );
}

export interface countDownFormatProps {
  time: number;
  seconds: number;
  totalSeconds: number;
  minutes: number;
  totalMinutes: number;
  hours: number;
  totalHours: number;
  days: number;
  onTheDayTime: number;
  duringTime: number;
}
interface CountDownProps extends React.HTMLAttributes<HTMLSpanElement> {
  date: Date;
  end?: Date | null;
  current?: Date;
  allDay?: boolean;
  format?: (options: countDownFormatProps) => string;
  notification?: boolean;
  title?: string;
}
export const CountDown = memo(function CountDown({
  date,
  end,
  current = new Date(),
  format,
  className,
  allDay,
  notification,
  title,
  ...props
}: CountDownProps) {
  className = useMemo(() => {
    const classNames = ["countdown"];
    if (className) classNames.push(className);
    return classNames.join(" ");
  }, [className]);
  const startTime = useMemo(() => {
    const d = new Date(date);
    if (allDay) toDayStart(d);
    let time = d.getTime();
    return time;
  }, [date, allDay]);
  const endTime = useMemo(() => {
    const d = new Date(end || date);
    if (allDay) {
      toDayStart(d);
      d.setDate(d.getDate() + 1);
    }
    return d.getTime();
  }, [end, date, allDay]);
  const duringTime = useMemo(
    () => (endTime || 864e5) - startTime,
    [startTime, endTime]
  );
  const firstTime = useMemo(() => startTime - current.getTime(), [startTime]);
  const onTheDayTime = useMemo(
    () =>
      ((date.getHours() * 60 + date.getMinutes()) * 60 + date.getSeconds()) *
        1000 +
      date.getMilliseconds(),
    [date]
  );
  useEffect(() => {
    const ml = firstTime % 1000;
    let interval: NodeJS.Timeout | undefined;
    setTimeout(() => {
      setTime((time) => time - ml);
      interval = setInterval(() => {
        setTime((time) => time - 1000);
      }, 1000);
    }, ml);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [firstTime]);
  const [time, setTime] = useState<number>(firstTime);
  const [firstTimeover, setFirstTimeover] = useState(firstTime <= 0);
  useEffect(() => {
    setTime(firstTime);
    setFirstTimeover(firstTime <= 0);
  }, [firstTime]);
  const currentTimeover = useMemo(() => time <= 0, [time]);
  const timeOver = useMemo(
    () => currentTimeover && !firstTimeover,
    [currentTimeover, firstTimeover]
  );
  useEffect(() => {
    if (timeOver) {
      if (notification) {
        let noticeText = "時間になりました！";
        if (title) noticeText = title + "\n" + noticeText;
        try {
          new Notification(noticeText);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [timeOver, notification]);
  const result = useMemo(() => {
    const totalSeconds = Math.floor(time / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = (totalSeconds - seconds) / 60;
    const minutes = totalMinutes % 60;
    const totalHours = (totalMinutes - minutes) / 60;
    const hours = totalHours % 24;
    const days = (totalHours - hours) / 24;
    if (format)
      return format({
        time,
        seconds,
        totalSeconds,
        minutes,
        totalMinutes,
        hours,
        totalHours,
        days,
        onTheDayTime,
        duringTime,
      });
    else {
      let str = "";
      if (time < 0) {
        const backTime = 864e5 + time - onTheDayTime;
        const backDays = Math.floor(backTime / 864e5);
        if (backDays) str = Math.abs(backDays) + "日前";
        else str = "当日";
      } else {
        str = "あと ";
        if (days) str = str + ` ${days}日`;
        if (days || hours) str = str + ` ${hours}時間`;
        if (days || hours || minutes) str = str + minutes + "分";
        str = str + seconds + "秒";
      }
      return str;
    }
  }, [time, format, onTheDayTime, duringTime]);
  return (
    <span className={className} {...props}>
      {result}
    </span>
  );
});
