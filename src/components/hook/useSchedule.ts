import { useEffect, useLayoutEffect, useMemo, useState } from 'react';

interface useScheduleProps {
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  specify?: boolean;
}

interface useScheduleValue {
  date: Date;
  nextDate: Date;
}
export default function useSchedule({ day, hour, minute, second = 0, specify }: useScheduleProps = { second: 1 }): useScheduleValue {
  const defaultDate = useMemo(() => new Date(), [])
  const [date, setDate] = useState(defaultDate);
  const [nextDate, setNextDate] = useState(getNextTime());
  function getNextTime(date = new Date()) {
    const newDate = new Date(date);
    newDate.setMilliseconds(0);
    if (typeof day === "number") {
      if (specify) {
        const isSame = newDate.getHours() === hour;
        newDate.setDate(day);
        newDate.setHours(hour || 0);
        newDate.setMinutes(minute || 0);
        newDate.setSeconds(second || 0);
        if (isSame || newDate.getTime() < date.getTime())
          newDate.setMonth(newDate.getMonth() + 1);
      }
      else newDate.setDate(newDate.getDate() + day);
    } else if (typeof hour === "number") {
      if (specify) {
        const isSame = newDate.getHours() === hour;
        newDate.setHours(hour);
        newDate.setMinutes(minute || 0);
        newDate.setSeconds(second || 0);
        if (isSame || newDate.getTime() < date.getTime())
          newDate.setDate(newDate.getDate() + 1);
      }
      else newDate.setHours(newDate.getHours() + hour);
    } else if (typeof minute === "number") {
      if (specify) {
        const isSame = newDate.getMinutes() === minute;
        newDate.setMinutes(minute || 0);
        newDate.setSeconds(second || 0);
        if (isSame || newDate.getTime() < date.getTime())
          newDate.setHours(newDate.getHours() + 1);
      }
      else newDate.setMinutes(newDate.getMinutes() + minute);
    } else if (specify) {
      const isSame = newDate.getSeconds() === second;
      newDate.setSeconds(second || 0);
      if (isSame || newDate.getTime() < date.getTime())
        newDate.setMinutes(newDate.getMinutes() + 1);
    } else {
      newDate.setSeconds(newDate.getSeconds() + (second || 0));
    }
    return newDate;
  }
  useLayoutEffect(() => {
    if (day || hour || minute || second || specify) {
      function update() {
        const date = new Date();
        setDate(date);
        const nextDate = getNextTime(date);
        setNextDate(nextDate);
        setTimeout(() => {
          update();
        }, nextDate.getTime() - date.getTime());
      }
      setTimeout(() => {
        update();
      }, nextDate.getTime() - new Date().getTime());
    }
  }, []);
  return { date, nextDate };
};