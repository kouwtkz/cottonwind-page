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
import { MultiParserWithMedia as MultiParser } from "../parse/MultiParserWithMedia";
import {
  RiFileCopyLine,
  RiLink,
  RiMapPinLine,
  RiTimeLine,
} from "react-icons/ri";
import { defaultLang } from "@/multilingual/envDef";
import { CreateObjectState, CreateState } from "@/state/CreateState";
import { useEnv, useIsLogin } from "@/state/EnvState";
import { CopyWithToast } from "@/functions/toastFunction";
import { eventsFetch } from "./SyncGoogleCalendar";
import { useKeyValueDB } from "@/state/KeyValueDBState";

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

const FC_SP_VIEW = "fc-view";
const FC_SP_YEAR = "fc-year";
const FC_SP_MONTH = "fc-month";
const FC_SP_DAY = "fc-day";
type Type_SP_FC =
  | typeof FC_SP_VIEW
  | typeof FC_SP_YEAR
  | typeof FC_SP_MONTH
  | typeof FC_SP_DAY;
const FC_VIEW_AGENDA = "agenda";
const FC_VIEW_WEEK = "week";
const FC_VIEW_MONTH = "month";
const FC_VIEW_DAY = "day";
type Type_VIEW_FC =
  | typeof FC_VIEW_AGENDA
  | typeof FC_VIEW_WEEK
  | typeof FC_VIEW_MONTH
  | typeof FC_VIEW_DAY;
const FC_SP_EVENT_ID = "fc-event-id";

export interface CalendarMeeProps
  extends React.ImgHTMLAttributes<HTMLDivElement> {
  events?: eventsItemType[];
  width?: number;
  height?: number;
  defaultView?: Type_VIEW_FC;
  visibleDateSet?: boolean;
}

function openWindow(url: string) {
  window.open(url, "google-calendar-event", "width=700,height=600");
}

interface EventCacheStateProps {
  events: EventsDataType[];
  add: EventsDataType[];
  eventsMap: Map<string, EventsDataType>;
  eventId: string | null;
  isOpenEvent: boolean;
  calendarList: string[];
  stateLock: boolean;
  view: Type_VIEW_FC | null;
  date: Date;
  timeRanges: timeRangesType[];
  getRange: timeRangesType | null;
  syncRange: timeRangesType | null;
  setTimeRanges: (range: timeRangesType) => void;
  isLoading: boolean;
}
type timeRangesType = { start: Date; end: Date };
const useCalendarMee = CreateObjectState<EventCacheStateProps>((set) => ({
  events: [],
  add: [],
  eventsMap: new Map(),
  eventId: null,
  isOpenEvent: false,
  calendarList: [],
  stateLock: false,
  view: null,
  date: dateFromSearchParams(new URLSearchParams(document.location.search)),
  timeRanges: [],
  getRange: null,
  syncRange: null,
  setTimeRanges(range) {
    set(({ timeRanges, syncRange }) => {
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
}));

function dateFromSearchParams(
  searchParams: URLSearchParams,
  date = new Date()
) {
  const newDate = new Date(date);
  if (searchParams.has(FC_SP_YEAR)) {
    const year = strToNumWithNull(searchParams.get(FC_SP_YEAR));
    if (year) newDate.setFullYear(year);
  }
  if (searchParams.has(FC_SP_MONTH)) {
    const month = strToNumWithNull(searchParams.get(FC_SP_MONTH));
    if (month) newDate.setMonth(month - 1);
  }
  if (searchParams.has(FC_SP_DAY)) {
    const day = strToNumWithNull(searchParams.get(FC_SP_DAY));
    if (day) newDate.setDate(day);
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

export function CalendarMeeState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventIdParam = useMemo(
    () => searchParams.get(FC_SP_EVENT_ID),
    [searchParams]
  );
  const env = useEnv()[0];
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
  } = useCalendarMee();
  useEffect(() => {
    if (add.length > 0) Set({ add: [] });
  }, [add]);
  const { kvList } = useKeyValueDB();
  const calendarList = useMemo(() => {
    if (env && kvList) {
      const list: string[] = [];
      if (env.GOOGLE_CALENDAR_ID) list.push(env.GOOGLE_CALENDAR_ID);
      kvList
        .filter((v) => v.key.startsWith("google-calendar-id-"))
        .forEach(({ value }) => {
          if (value) list.push(value);
        });
      return list;
    }
  }, [kvList, env]);
  useEffect(() => {
    Set({ calendarList });
  }, [calendarList]);
  useEffect(() => {
    if (getRange && calendarList) setTimeRanges(getRange);
  }, [getRange, calendarList]);
  const API_KEY = useMemo(() => env?.GOOGLE_CALENDAR_API, [env]);
  useEffect(() => {
    if (API_KEY && syncRange && calendarList) {
      Set({ isLoading: true });
      Promise.all(
        calendarList.map(async (id) => {
          return eventsFetch({
            id,
            key: API_KEY,
            start: syncRange.start,
            end: syncRange.end,
          }).then((data) => {
            if (data?.items && Array.isArray(data.items)) {
              Set(({ eventsMap }) => {
                const add: EventsDataType[] = [];
                data.items.forEach((item) => {
                  if (!eventsMap.has(item.id)) add.push(item);
                  eventsMap.set(item.id, item);
                });
                return {
                  eventsMap,
                  events: Object.values(Object.fromEntries(eventsMap)),
                  add,
                };
              });
            }
          });
        })
      ).finally(() => {
        Set({ isLoading: false });
        Set({ syncRange: null });
      });
    }
  }, [API_KEY, calendarList, syncRange]);

  useEffect(() => {
    const newDate = dateFromSearchParams(searchParams);
    if (date.toString() !== newDate.toString()) {
      Set({ date: newDate });
    }
  }, [searchParams]);
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

  return <CalendarMeeEventViewer />;
}

export function CalendarMee({
  height,
  style = {},
  defaultView = FC_VIEW_MONTH,
  visibleDateSet,
  className,
  ...args
}: CalendarMeeProps) {
  className = useMemo(() => {
    const classNames: string[] = ["fc"];
    if (className) classNames.push(className);
    return classNames.join(" ");
  }, [className]);
  const { Set, eventId, events, date, isLoading } = useCalendarMee();
  const [calendar, setCalendar] = useState<Calendar | null>(null);
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
  useEffect(() => {
    if (calendar && calendar.getDate().toString() !== date.toString()) {
      setTimeout(() => {
        calendar.gotoDate(date);
      }, 0);
    }
  }, [calendar, date]);
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
  const eventOpen = useCallback((e: EventClickArg) => {
    Set({ eventId: e.event.id, isOpenEvent: Boolean(e.event.id) });
    e.jsEvent.preventDefault();
  }, []);
  return (
    <div {...{ ...args, style, className }}>
      <FullCalendar
        height={height}
        ref={(e: any) => {
          const fullCalendar = e as CustomFullCalendar | null;
          if (fullCalendar) {
            const calendar = fullCalendar.calendar;
            setCalendar(calendar);
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
          end: `${
            visibleDateSet ? "dateSet " : ""
          }${FC_VIEW_MONTH},${FC_VIEW_WEEK},${FC_VIEW_AGENDA} prev,today,next`,
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

export function CalendarMeeEventViewer() {
  const {
    Set,
    eventsMap,
    eventId: stateEventId,
    isOpenEvent,
    isLoading,
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
  const isLogin = useIsLogin()[0];
  const location = event?.location;
  const startDate = event?.start;
  let endDate = event ? new Date(event.end) : null;
  const startFormat: FormatDateOptions = {
    locale: defaultLang,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "narrow",
  };
  const endFormat: FormatDateOptions = {
    locale: defaultLang,
  };
  if (event) {
    if (!event.allDay) {
      startFormat.hour = "numeric";
      startFormat.minute = "numeric";
    }
    if (startDate && endDate) {
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
        endFormat.minute = "numeric";
        endFormat.hour = "numeric";
      }
    }
  }
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
  const [searchParams, setSearchParams] = useSearchParams();
  const visibleCountdownParam = useMemo(
    () => searchParams.has("countdown"),
    [searchParams]
  );
  const beforeCloseDdRef = useRef(visibleCountdownParam);
  const keepDdRef = useRef(visibleCountdownParam);
  const visibleCountdown = useMemo(() => {
    let visibleCountdown: boolean;
    if (!stateEventId && beforeCloseDdRef.current !== visibleCountdownParam) {
      visibleCountdown = beforeCloseDdRef.current;
    } else visibleCountdown = visibleCountdownParam;
    beforeCloseDdRef.current = visibleCountdownParam;
    return visibleCountdown;
  }, [stateEventId, visibleCountdownParam]);
  const setCountdown = useCallback(
    (v: boolean) => {
      const options = { state, preventScrollReset: true, replace: true };
      if (v && !visibleCountdown) {
        setSearchParams((searchParams) => {
          searchParams.set("countdown", "on");
          return searchParams;
        }, options);
        keepDdRef.current = true;
      } else if (!v && visibleCountdown) {
        setSearchParams((searchParams) => {
          searchParams.delete("countdown");
          return searchParams;
        }, options);
        keepDdRef.current = false;
      }
    },
    [visibleCountdown, state]
  );
  useEffect(() => {
    if (isOpenEvent && keepDdRef.current && !visibleCountdown) {
      setCountdown(true);
    }
  }, [isOpenEvent]);
  return (
    <>
      <Modal
        classNameEntire="fc"
        onClose={ModalCloseHandler}
        onExited={EventCloseHandler}
        isOpen={isOpen}
        timeout={60}
      >
        {event ? (
          <>
            {startDate ? (
              <h4>
                <a
                  className="time"
                  href={event.url}
                  target="google-calendar-event"
                >
                  <span className="start">
                    {formatDate(startDate, startFormat)}
                  </span>
                  {endDate ? (
                    <>
                      <span className="during">-</span>
                      <span className="end">
                        {formatDate(endDate, endFormat)}
                      </span>
                    </>
                  ) : null}
                </a>
              </h4>
            ) : null}
            {visibleCountdown && startDate ? (
              <h5>
                <CountDown date={startDate} end={endDate} />
              </h5>
            ) : null}
            <div className="title">
              <h3>{event.title}</h3>
              <div>
                {isLogin ? (
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
                    (visibleCountdown ? "しまう" : "表示する")
                  }
                  type="button"
                  onClick={() => setCountdown(!visibleCountdown)}
                >
                  <RiTimeLine />
                </button>
              </div>
            </div>
            {location ? (
              <div>
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
              </div>
            ) : null}
            <div>
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
  format?: (options: countDownFormatProps) => string;
}
export const CountDown = memo(function CountDown({
  date,
  end,
  current = new Date(),
  format,
  className,
  ...props
}: CountDownProps) {
  className = useMemo(() => {
    const classNames = ["countdown"];
    if (className) classNames.push(className);
    return classNames.join(" ");
  }, [className]);
  const startTime = useMemo(() => date.getTime(), [date]);
  const endTime = useMemo(() => end?.getTime(), [end]);
  const duringTime = useMemo(
    () => (endTime || 864e5) - startTime,
    [startTime, endTime]
  );
  const [time, setTime] = useState<number>(startTime - current.getTime());
  const onTheDayTime = useMemo(
    () =>
      ((date.getHours() * 60 + date.getMinutes()) * 60 + date.getSeconds()) *
        1000 +
      date.getMilliseconds(),
    [date]
  );
  useEffect(() => {
    const ml = time % 1000;
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
  }, []);
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
        const backTime = time - onTheDayTime;
        const backDays = Math.round(backTime / 864e5);
        if (backDays) str = Math.abs(backDays) + "日前";
        else str = "当日";
      } else {
        str = "あと";
        if (days) str = str + ` ${days}日`;
        if (days || hours) str = str + ` ${hours}時間`;
        if (days || hours || minutes) str = str + minutes + "分";
        if (days || hours || minutes || seconds) str = str + seconds + "秒";
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
