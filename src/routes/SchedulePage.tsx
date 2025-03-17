import CalendarMee from "@/components/schedule/CalendarMee";
import { useEnv } from "@/state/EnvState";
// import { GoogleCalendarOptionsType } from "./CalendarType";

export function SchedulePage({ title = "Schedule" }: { title?: string }) {
  const env = useEnv()[0];
  let googleCalenderOptions: GoogleCalendarOptionsType | undefined;
  if (env && env.GOOGLE_CALENDAR_API && env.GOOGLE_CALENDAR_ID) {
    googleCalenderOptions = {
      apiKey: env.GOOGLE_CALENDAR_API,
      calendarId: env.GOOGLE_CALENDAR_ID,
    };
  }
  return (
    <div>
      <h1 className="color-main en-title-font">{title}</h1>
      <CalendarMee
        google={googleCalenderOptions}
        height={580}
        className="text-sm sm:text-base m-2 sm:mx-auto max-w-4xl"
      />
    </div>
  );
}
