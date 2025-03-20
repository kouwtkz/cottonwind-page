import FullCalendar from "@fullcalendar/react";
import googleCalendarPlugin from "@fullcalendar/google-calendar";
import dayGridPlugin from "@fullcalendar/daygrid";
import allLocales from "@fullcalendar/core/locales-all";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  DatesSetArg,
  EventClickArg,
  formatDate,
  FormatDateOptions,
  FormatterInput,
} from "@fullcalendar/core/index.js";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { strToNumWithNull } from "@/functions/strTo";
import { Modal } from "@/layout/Modal";
import { EventImpl } from "@fullcalendar/core/internal";
import { MultiParser } from "../parse/MultiParser";
import { RiLink, RiMapPinLine } from "react-icons/ri";
import { defaultLang } from "@/multilingual/envDef";

interface CustomFullCalendar extends Omit<FullCalendar, "calendar"> {
  calendar: Calendar;
}

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
  google?: GoogleCalendarOptionsType;
  events?: eventsItemType[];
  width?: number;
  height?: number;
  defaultView?: Type_VIEW_FC;
  agendaDays?: number;
  visibleDateSet?: boolean;
}

function openWindow(url: string) {
  window.open(url, "google-calendar-event", "width=700,height=600");
}

export default function CalendarMee({
  google,
  height,
  style = {},
  defaultView = FC_VIEW_MONTH,
  agendaDays = 184,
  visibleDateSet,
  className,
  ...args
}: CalendarMeeProps) {
  className = useMemo(() => {
    const classNames: string[] = ["fc"];
    if (className) classNames.push(className);
    return classNames.join();
  }, [className]);
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const eventViewId = useMemo(
    () => searchParams.get(FC_SP_EVENT_ID),
    [searchParams]
  );
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<Type_VIEW_FC | null>();
  const onChangeHandle = useCallback(
    (arg: DatesSetArg) => {
      if (calendar) {
        setDate(calendar.getDate());
        setView(calendar.view.type as Type_VIEW_FC);
      }
    },
    [calendar, eventViewId]
  );
  const settingDate = useRef(true);
  const settingSearchParams = useRef(false);
  const viewParams = useMemo(
    () => searchParams.get(FC_SP_VIEW) || defaultView,
    [searchParams, defaultView]
  );
  const year = useMemo(
    () => strToNumWithNull(searchParams.get(FC_SP_YEAR)),
    [searchParams]
  );
  const month = useMemo(
    () => strToNumWithNull(searchParams.get(FC_SP_MONTH)),
    [searchParams]
  );
  const day = useMemo(
    () => strToNumWithNull(searchParams.get(FC_SP_DAY)),
    [searchParams]
  );
  useEffect(() => {
    if (settingSearchParams.current) {
      settingSearchParams.current = false;
    } else if (calendar) {
      settingDate.current = true;
      let newDate: Date | undefined;
      if (year || month || day) {
        const date = calendar.getDate();
        if (year) date.setFullYear(year);
        if (month) date.setMonth(month - 1);
        if (day) date.setDate(day);
        newDate = date;
      } else {
        newDate = new Date();
      }
      const view = viewParams || defaultView;
      setTimeout(() => {
        calendar.gotoDate(newDate);
        if (view) calendar.changeView(view);
      }, 0);
    }
  }, [calendar, year, month, day, viewParams]);
  useEffect(() => {
    if (settingDate.current) {
      settingDate.current = false;
    } else {
      settingSearchParams.current = true;
      const beforeSearch = location.search;
      const searchParams = new URLSearchParams(beforeSearch);
      const dateDiff = Math.abs(new Date().getTime() - date.getTime());
      if (view === defaultView) searchParams.delete(FC_SP_VIEW);
      else if (view) searchParams.set(FC_SP_VIEW, view);
      if (dateDiff < 600000) {
        searchParams.delete(FC_SP_YEAR);
        searchParams.delete(FC_SP_MONTH);
        searchParams.delete(FC_SP_DAY);
      } else {
        searchParams.set(FC_SP_YEAR, date.getFullYear().toString());
        searchParams.set(FC_SP_MONTH, (date.getMonth() + 1).toString());
        searchParams.set(FC_SP_DAY, date.getDate().toString());
      }
      const afterSearch =
        (searchParams.size ? "?" : "") + searchParams.toString();
      if (beforeSearch !== afterSearch) {
        setSearchParams(searchParams, { preventScrollReset: true });
      }
    }
  }, [date, view]);
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
  const GoogleOptions = useMemo(
    () =>
      google
        ? {
            googleCalendarApiKey: google.apiKey,
            eventSources: [
              {
                googleCalendarId: google.calendarId,
              },
            ],
          }
        : null,
    [google]
  );
  const [isLoading, setLoading] = useState(false);
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
  const { state } = useLocation();
  const nav = useNavigate();
  const setEventSearchParams = useCallback(
    (e: EventImpl | null) => {
      const searchParams = new URLSearchParams(location.search);
      if (e) {
        if (e) searchParams.set(FC_SP_EVENT_ID, e.id);
        setSearchParams(searchParams, {
          preventScrollReset: true,
          state: { ...(state || {}), from: location.href },
        });
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
  const [eventView, setEventView] = useState<EventImpl | null>();
  const updateEventView = useCallback(() => {
    if (calendar) {
      if (eventViewId) {
        const event = calendar.getEventById(eventViewId);
        if (eventView?.id !== event?.id) setEventView(event);
      } else if (eventView) {
        setEventView(null);
      }
    }
  }, [calendar, eventViewId, eventView]);
  const eventOpen = useCallback((e: EventClickArg) => {
    setEventSearchParams(e.event);
    e.jsEvent.preventDefault();
  }, []);
  const EventCloseHandler = useCallback(() => {
    setEventSearchParams(null);
  }, [state]);
  const EventViewer = useCallback(() => {
    const location = eventView?.extendedProps.location;
    const startDate = eventView?.start;
    let endDate = eventView?.end;
    const startFormat: FormatDateOptions = {
      locale: defaultLang,
      dateStyle: "long",
    };
    const endFormat: FormatDateOptions = {
      locale: defaultLang,
    };
    if (eventView) {
      if (!eventView.allDay) {
        startFormat.timeStyle = "short";
      }
      if (startDate && endDate) {
        function setEndDateFormat() {
          if (startDate!.getFullYear() !== endDate!.getFullYear()) {
            endFormat.year = "numeric";
          }
          if (startDate!.getMonth() !== endDate!.getMonth()) {
            endFormat.month = "long";
          }
          if (startDate!.getDate() !== endDate!.getDate()) {
            endFormat.day = "numeric";
          }
        }
        if (eventView.allDay) {
          const sameDate = Math.floor(
            (endDate.getTime() - startDate.getTime()) / 86400000
          );
          if (sameDate < 2) {
            endDate = null;
          } else {
            setEndDateFormat();
          }
        } else {
          setEndDateFormat();
          endFormat.minute = "numeric";
          endFormat.hour = "numeric";
        }
      }
    }
    return (
      <>
        {eventView ? (
          <Modal onClose={EventCloseHandler}>
            {startDate ? (
              <h4>
                <a
                  className="time"
                  href={eventView.url}
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
            <h3>{eventView.title}</h3>
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
              <MultiParser>{eventView.extendedProps.description}</MultiParser>
            </div>
          </Modal>
        ) : null}
      </>
    );
  }, [eventView]);

  if (!google) return <div>Googleカレンダーのプロパティがありません</div>;
  return (
    <div {...{ ...args, style, className }}>
      <EventViewer />
      <FullCalendar
        height={height}
        ref={(e: any) => {
          const fullCalendar = e as CustomFullCalendar | null;
          if (fullCalendar) {
            const calendar = fullCalendar.calendar;
            setCalendar(calendar);
            updateEventView();
          }
        }}
        lazyFetching
        plugins={[
          googleCalendarPlugin,
          dayGridPlugin,
          timeGridPlugin,
          listPlugin,
        ]}
        locales={allLocales}
        {...GoogleOptions}
        initialView="dayGridMonth"
        locale={"ja"}
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
            duration: { days: agendaDays },
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
        loading={(v) => {
          setLoading(v);
        }}
        noEventsText={noEventsText}
      />
    </div>
  );
}
