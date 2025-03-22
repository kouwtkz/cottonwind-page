import {
  CalendarMee,
  CalendarMeeProps,
} from "@/components/schedule/CalendarMee";

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
  return (
    <CalendarMee height={height} {...args} />
  );
}
