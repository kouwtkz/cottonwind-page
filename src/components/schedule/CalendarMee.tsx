import FullCalendar from "@fullcalendar/react";
import googleCalendarPlugin from "@fullcalendar/google-calendar";
import dayGridPlugin from "@fullcalendar/daygrid";
import allLocales from "@fullcalendar/core/locales-all";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import {
  Calendar,
  CustomContentGenerator,
  EventClickArg,
  EventContentArg,
  FormatterInput,
} from "@fullcalendar/core/index.js";
import { useSearchParams } from "react-router-dom";
import { strToNumWithNull } from "@/functions/strTo";

interface CustomFullCalendar extends Omit<FullCalendar, "calendar"> {
  calendar: Calendar;
}

function convertModeToView(mode: calendarModeType): calendarViewType | null {
  switch (mode) {
    case "agenda":
      return "listWeek";
    case "month":
      return "dayGridMonth";
    case "day":
      return "dayGridDay";
    default:
      return null;
  }
}
function convertViewToMode(view: calendarViewType): calendarModeType | null {
  switch (view) {
    case "listWeek":
      return "agenda";
    case "dayGridMonth":
      return "month";
    case "dayGridDay":
      return "day";
    default:
      return null;
  }
}

const eventContent: CustomContentGenerator<EventContentArg> = ({
  event,
  timeText,
  view,
}) => {
  let title = event._def.title;
  if (title === "undefined") title = "予定あり";
  let titleNode = <div className="fc-event-title">{title}</div>;
  if (/^list/.test(view.type)) titleNode = <a href={event.url}>{titleNode}</a>;
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
};

const titleFormat: FormatterInput = ({ start, end }) => {
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

function eventClick(e: EventClickArg) {
  window.open(e.event.url, "google-calendar-event", "width=700,height=600");
  e.jsEvent.preventDefault();
}

export interface CalendarMeeProps
  extends React.ImgHTMLAttributes<HTMLDivElement> {
  google?: GoogleCalendarOptionsType;
  events?: eventsItemType[];
  width?: number;
  height?: number;
  defaultMode?: calendarModeType;
}

export default function CalendarMee({
  google,
  height,
  style = {},
  defaultMode = "month",
  ...args
}: CalendarMeeProps) {
  const [fullCalendar, setFullCalendar] = useState<CustomFullCalendar | null>(
    null
  );
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState<calendarModeType | null>();
  const onChangeHandle = useCallback(() => {
    if (fullCalendar) {
      setDate(fullCalendar.calendar.getDate());
      setMode(
        convertViewToMode(fullCalendar.calendar.view.type as calendarViewType)
      );
    }
  }, [fullCalendar]);
  const settingDate = useRef(true);
  const settingSearchParams = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const modeParams = useMemo(
    () => (searchParams.get("mode") || defaultMode) as calendarModeType,
    [searchParams, defaultMode]
  );
  const year = useMemo(
    () => strToNumWithNull(searchParams.get("year")),
    [searchParams]
  );
  const month = useMemo(
    () => strToNumWithNull(searchParams.get("month")),
    [searchParams]
  );
  const day = useMemo(
    () => strToNumWithNull(searchParams.get("day")),
    [searchParams]
  );
  useEffect(() => {
    if (settingSearchParams.current) {
      settingSearchParams.current = false;
    } else if (fullCalendar) {
      settingDate.current = true;
      let newDate: Date | undefined;
      if (year || month || day) {
        const date = fullCalendar.calendar.getDate();
        if (year) date.setFullYear(year);
        if (month) date.setMonth(month - 1);
        if (day) date.setDate(day);
        newDate = date;
      } else {
        newDate = new Date();
      }
      const mode = modeParams || defaultMode;
      const view = convertModeToView(mode);
      setTimeout(() => {
        fullCalendar.calendar.gotoDate(newDate);
        if (view) fullCalendar.calendar.changeView(view);
      }, 0);
    }
  }, [fullCalendar, year, month, day, modeParams]);
  useEffect(() => {
    if (settingDate.current) {
      settingDate.current = false;
    } else {
      settingSearchParams.current = true;
      setSearchParams(
        (searchParams) => {
          const dateDiff = Math.abs(new Date().getTime() - date.getTime());
          if (mode === defaultMode) searchParams.delete("mode");
          else if (mode) searchParams.set("mode", mode);
          if (dateDiff < 600000) {
            searchParams.delete("year");
            searchParams.delete("month");
            searchParams.delete("day");
            return searchParams;
          } else {
            searchParams.set("year", date.getFullYear().toString());
            searchParams.set("month", (date.getMonth() + 1).toString());
            searchParams.set("day", date.getDate().toString());
            return searchParams;
          }
        },
        { preventScrollReset: true }
      );
    }
  }, [date, mode]);
  const DateJumpButtonClick = useCallback(
    (e: MouseEvent) => {
      if (fullCalendar) {
        const elm = e.target as HTMLInputElement;
        let c = elm.parentElement!.querySelector(
          "input#dateSelector"
        ) as HTMLInputElement | null;
        if (!c) {
          const nc = document.createElement("input");
          nc.type = "datetime-local";
          nc.id = "dateSelector";
          nc.onchange = () => {
            fullCalendar.calendar.gotoDate(new Date(nc.value));
            nc.remove();
          };
          elm.after(nc as any);
        } else {
          c.remove();
        }
      }
    },
    [fullCalendar]
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
  if (height !== undefined) style.height = height;
  if (!google) return <div>Googleカレンダーのプロパティがありません</div>;
  return (
    <div {...{ ...args, style }}>
      <FullCalendar
        height={height}
        ref={(e: any) => {
          setFullCalendar(e);
        }}
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
        eventClick={eventClick}
        moreLinkClick={(args) => {
          args.jsEvent.preventDefault();
        }}
        datesSet={onChangeHandle}
        headerToolbar={{
          start: "title",
          end: "dateSet dayGridMonth,listWeek prev,today,next",
        }}
        buttonText={{
          today: "現在",
          listWeek: "予定",
        }}
        eventContent={eventContent}
        customButtons={{
          dateSet: {
            text: "日時",
            click: DateJumpButtonClick,
          },
        }}
        views={{
          listWeek: { titleFormat },
        }}
        loading={(v) => {
          setLoading(v);
        }}
        noEventsText={
          isLoading ? "読み込み中…" : "この週はイベントはありません"
        }
      />
    </div>
  );
}
