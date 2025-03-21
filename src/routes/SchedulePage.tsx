import {
  CalendarMee,
  CalendarMeeProps,
} from "@/components/schedule/CalendarMee";
import { useEnv } from "@/state/EnvState";

export function SchedulePage({ title = "Schedule" }: { title?: string }) {
  return (
    <div>
      <h1 className="color-main en-title-font">{title}</h1>
      <ScheduleContainer />
    </div>
  );
}

interface ScheduleContainerProps extends Omit<CalendarMeeProps, "google"> {}

export function ScheduleContainer({
  height = 580,
  ...args
}: ScheduleContainerProps) {
  const env = useEnv()[0];
  let googleCalenderOptions: GoogleCalendarOptionsType | undefined;
  if (env && env.GOOGLE_CALENDAR_API && env.GOOGLE_CALENDAR_ID) {
    googleCalenderOptions = {
      apiKey: env.GOOGLE_CALENDAR_API,
      calendarId: env.GOOGLE_CALENDAR_ID,
    };
  }
  return (
    <CalendarMee google={googleCalenderOptions} height={height} {...args} />
  );
}
