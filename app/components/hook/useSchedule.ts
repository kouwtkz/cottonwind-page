import { useEffect, useMemo, useState } from 'react';

interface useScheduleProps {
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  specify?: boolean;
}

interface useScheduleValue {
  date: Temporal.ZonedDateTime;
  nextDate: Temporal.ZonedDateTime;
}
export default function useSchedule({ day, hour, minute, second = 0, specify }: useScheduleProps = { second: 1 }): useScheduleValue {
  const defaultDate = useMemo(() => Temporal.Now.zonedDateTimeISO(), [])
  const [date, setDate] = useState(defaultDate);
  const [nextDate, setNextDate] = useState(getNextTime());
  function getNextTime(date = Temporal.Now.zonedDateTimeISO()) {
    let newDate = date.with({ millisecond: 0, microsecond: 0 });
    if (typeof day === "number") {
      if (specify) {
        const isSame = newDate.hour === hour;
        newDate = newDate.with({ day, hour: hour || 0, minute: minute || 0, second: second || 0 });
        if (isSame || Temporal.ZonedDateTime.compare(newDate, date) < 0)
          newDate = newDate.add({ months: 1 });
      }
      else newDate = newDate.add({ days: day });
    } else if (typeof hour === "number") {
      if (specify) {
        const isSame = newDate.hour === hour;
        newDate = newDate.with({ hour, minute: minute || 0, second: second || 0 });
        if (isSame || Temporal.ZonedDateTime.compare(newDate, date) < 0)
          newDate = newDate.add({ days: 1 });
      }
      else newDate = newDate.add({ hours: hour });
    } else if (typeof minute === "number") {
      if (specify) {
        const isSame = newDate.minute === minute;
        newDate = newDate.with({ minute: minute || 0, second: second || 0 });
        if (isSame || Temporal.ZonedDateTime.compare(newDate, date) < 0)
          newDate = newDate.add({ hours: 1 });
      }
      else newDate = newDate.add({ minutes: minute });
    } else if (specify) {
      const isSame = newDate.second === second;
      newDate = newDate.with({ second: second || 0 });
      if (isSame || Temporal.ZonedDateTime.compare(newDate, date) < 0)
        newDate = newDate.add({ minutes: 1 });
    } else {
      newDate = newDate.add({ seconds: second || 0 });
    }
    return newDate;
  }
  useEffect(() => {
    if (day || hour || minute || second || specify) {
      function update() {
        const date = Temporal.Now.zonedDateTimeISO();
        setDate(date);
        const nextDate = getNextTime(date);
        setNextDate(nextDate);
        setTimeout(() => {
          update();
        }, nextDate.epochMilliseconds - date.epochMilliseconds);
      }
      setTimeout(() => {
        update();
      }, nextDate.epochMilliseconds - Temporal.Now.zonedDateTimeISO().epochMilliseconds);
    }
  }, []);
  return { date: date, nextDate: nextDate };
};