import FullCalendar from "@fullcalendar/react";
import googleCalendarPlugin from "@fullcalendar/google-calendar";
import dayGridPlugin from "@fullcalendar/daygrid";
import allLocales from "@fullcalendar/core/locales-all";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import { Suspense, useCallback, useRef } from "react";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";

interface CalendarMeeProps extends React.ImgHTMLAttributes<HTMLDivElement> {
  google?: GoogleCalendarOptionsType;
  events?: eventsItemType[];
  width?: number;
  height?: number;
}

export default function CalendarMee({
  google,
  height,
  style = {},
  ...args
}: CalendarMeeProps) {
  const calendarRef = useRef<FullCalendar>(null);
  if (!google) return <div>Googleカレンダーのプロパティがありません</div>;
  const GoogleOptions = {
    googleCalendarApiKey: google.apiKey,
    eventSources: [
      {
        googleCalendarId: google.calendarId,
      },
    ],
  };
  if (height !== undefined) style.height = height;
  return (
    <div {...{ ...args, style }}>
      <FullCalendar
        height={height}
        ref={calendarRef}
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
        eventClick={(args) => {
          window.open(
            args.event.url,
            "google-calendar-event",
            "width=700,height=600"
          );
          args.jsEvent.preventDefault();
        }}
        moreLinkClick={(args) => {
          args.jsEvent.preventDefault();
        }}
        headerToolbar={{
          end: "dayGridMonth,listWeek prev,today,next",
        }}
        buttonText={{
          today: "現在",
          listWeek: "予定",
        }}
        eventContent={({ event, timeText, view }) => {
          let title = event._def.title;
          if (title === "undefined") title = "予定あり";
          let titleNode = <div className="fc-event-title">{title}</div>;
          if (/^list/.test(view.type))
            titleNode = <a href={event.url}>{titleNode}</a>;
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
        views={{
          listWeek: {
            titleFormat: ({ start, end }) => {
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
            },
          },
        }}
      />
    </div>
  );
}
