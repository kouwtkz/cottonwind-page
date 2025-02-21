import { useLayoutEffect, useMemo, useState } from 'react';

interface useScheduleProps {
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
}

interface useScheduleValue {
  date: Date;
  nextDate: Date;
}
export default function useSchedule({ day = 0, hour = 0, minute = 0, second = 0 }: useScheduleProps = { second: 1 }): useScheduleValue {
  const defaultDate = useMemo(() => new Date(), [])
  const [date, setDate] = useState(defaultDate);
  const [nextDate, setNextDate] = useState(getNextTime());
  function getNextTime() {
    const newDate = new Date();
    newDate.setMilliseconds(0);
    if (day) {
      newDate.setDate(newDate.getDate() + hour);
      newDate.setHours(hour);
      newDate.setMinutes(minute);
      newDate.setSeconds(second);
    } else if (hour) {
      newDate.setHours(newDate.getHours() + hour);
      newDate.setMinutes(minute);
      newDate.setSeconds(second);
    } else if (minute) {
      newDate.setMinutes(newDate.getMinutes() + minute);
      newDate.setSeconds(second);
    } else {
      newDate.setSeconds(newDate.getSeconds() + second);
    }
    return newDate;
  }
  const nextTimeMilliseconds = useMemo(() => (((day * 24 + hour) * 60 + minute) * 60 + second) * 1000, []);
  useLayoutEffect(() => {
    if (hour || minute || second) {
      setTimeout(() => {
        setDate(nextDate);
        setInterval(() => {
          const nextDate2 = getNextTime();
          setDate(nextDate2);
          const nextDate3 = new Date(nextDate2);
          nextDate3.setMilliseconds(nextTimeMilliseconds);
          setNextDate(nextDate3);
        }, nextTimeMilliseconds)
      }, nextDate.getTime() - new Date().getTime());
    }
  }, []);
  return { date, nextDate };
};