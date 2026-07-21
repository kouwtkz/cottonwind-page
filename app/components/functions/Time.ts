export class TimeClass {
  value: string;
  time: number;
  days: number;
  hours: number;
  dayHours: number;
  roundedHours: number;
  minutes: number;
  dayMinutes: number;
  seconds: number;
  daySeconds: number;
  formattedValue: string;
  constructor(value?: string | number, zero?: boolean) {
    if (typeof value === "string") {
      this.value = value;
      this.time = zero ? 0 : NaN;
    } else {
      this.time = value || (zero ? 0 : NaN);
      this.value = "";
    }
    if (this.value) {
      const parsed = TimeClass.Parse(this.value);
      this.days = parsed[0];
      this.dayHours = parsed[1];
      this.hours = this.days * 24 + this.dayHours;
      this.dayMinutes = parsed[2];
      this.minutes = this.dayMinutes + this.hours * 60;
      this.daySeconds = parsed[3];
      this.time = this.minutes * 60 + this.daySeconds;
      this.formattedValue = this.FormatValue();
    } else if (this.time) {
      this.daySeconds = this.time % 60;
      this.minutes = Math.floor(this.time / 60);
      this.dayMinutes = this.minutes % 60;
      this.hours = Math.floor(this.minutes / 60);
      this.dayHours = this.hours % 24;
      this.days = Math.floor(this.hours / 24);
      this.formattedValue = this.FormatValue();
      this.value = this.formattedValue;
    } else if (isNaN(this.time)) {
      this.daySeconds = NaN;
      this.minutes = NaN;
      this.dayMinutes = NaN;
      this.hours = NaN;
      this.dayHours = NaN;
      this.days = NaN;
      this.time = NaN;
      this.formattedValue = "";
    } else {
      this.daySeconds = 0;
      this.minutes = 0;
      this.dayMinutes = 0;
      this.hours = 0;
      this.dayHours = 0;
      this.days = 0;
      this.time = 0;
      this.formattedValue = this.FormatValue();
    }
    if (this.time) {
      this.roundedHours = Math.round(this.time / 3600);
    } else {
      this.roundedHours = this.time;
    }
    this.seconds = this.time;
  }
  FormatValue(days?: boolean, separator = ":") {
    const arr: string[] = [];
    if (days) {
      if (this.days) arr.push(('00' + this.days).slice(-2));
      arr.push(('00' + this.dayHours).slice(-2));
    } else {
      if (this.hours < 100)
        arr.push(('00' + this.hours).slice(-2));
      else
        arr.push(this.hours.toString());
    }
    arr.push(('00' + this.dayMinutes).slice(-2));
    arr.push(('00' + this.daySeconds).slice(-2));
    return arr.join(separator);
  }
  FormatToJP(days?: boolean, separator = "") {
    const arr: string[] = [];
    if (days) {
      if (this.days) arr.push(this.days + "日");
      if (this.dayHours) arr.push(this.dayHours + "時間");
    } else {
      if (this.hours) arr.push(this.hours + "時間");
    }
    if (this.dayMinutes) arr.push(this.dayMinutes + "分");
    if (this.daySeconds) arr.push(this.daySeconds + "秒");
    return arr.join(separator);
  }
  SetValue(value?: string | number) {
    this.constructor(value);
  }
  static Parse(value: string): [number, number, number, number] {
    const m = value.match(/^(\d*)(^|\:)(\d*)(^|\:)(\d*)(^|\:)(\d+)$/) || [];
    const minuteMode = !m[4] && m[6];
    let days = minuteMode ? 0 : (m[1] ? Number(m[1]) : 0);
    let hours = minuteMode ? Number(m[5]) : (m[3] ? Number(m[3]) : 0);
    let minutes = minuteMode ? Number(m[7]) : (m[5] ? Number(m[5]) : 0);
    let seconds = minuteMode ? 0 : (m[7] ? Number(m[7]) : 0);
    minutes += Math.floor(seconds / 60);
    hours += Math.floor(minutes / 60);
    days += Math.floor(hours / 24);
    seconds = seconds % 60;
    minutes = minutes % 60;
    hours = hours % 24;
    return [days, hours, minutes, seconds];
  }
}
