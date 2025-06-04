import { CalendarMee, CalendarMeeProps } from "~/components/calendar/CalendarMee";

const MeeCalendarURL = location.hostname.endsWith(".pages.dev")
  ? "https://cottonwind-calendar.pages.dev"
  : "https://calendar.cottonwind.com";

export function SchedulePage({ title = "Schedule" }: { title?: string }) {
  return (
    <div>
      <h1 className="color-main en-title-font">{title}</h1>
      <h4>
        <a target="mee-calendar" href={MeeCalendarURL}>
          めぇ式カレンダーアプリ
        </a>
      </h4>
      <ScheduleContainer />
    </div>
  );
}

interface ScheduleContainerProps extends Omit<CalendarMeeProps, "google"> {}

export function ScheduleContainer({
  height = 580,
  ...args
}: ScheduleContainerProps) {
  return <CalendarMee height={height} {...args} />;
}
