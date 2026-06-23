export class TimeClass {
  value: string;
  time: number;
  days: number;
  hours: number;
  fullHours: number;
  minutes: number;
  seconds: number;
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
      this.hours = parsed[1];
      this.fullHours = this.days * 24 + this.hours;
      this.minutes = parsed[2];
      this.seconds = parsed[3];
      this.time = (this.fullHours * 60 + this.minutes) * 60 + this.seconds;
      this.formattedValue = this.FormatValue();
    } else if (this.time) {
      this.seconds = this.time % 60;
      const fullMinutes = Math.floor(this.time / 60);
      this.minutes = fullMinutes % 60;
      this.fullHours = Math.floor(fullMinutes / 60);
      this.hours = this.fullHours % 24;
      this.days = Math.floor(this.fullHours / 24);
      this.formattedValue = this.FormatValue();
      this.value = this.formattedValue;
    } else if (isNaN(this.time)) {
      this.seconds = NaN;
      this.minutes = NaN;
      this.fullHours = NaN;
      this.hours = NaN;
      this.days = NaN;
      this.time = NaN;
      this.formattedValue = "";
    } else {
      this.seconds = 0;
      this.minutes = 0;
      this.fullHours = 0;
      this.hours = 0;
      this.days = 0;
      this.time = 0;
      this.formattedValue = this.FormatValue();
    }
  }
  FormatValue(days?: boolean, separator = ":") {
    const arr: string[] = [];
    if (days) {
      if (this.days) arr.push(('00' + this.days).slice(-2));
      arr.push(('00' + this.hours).slice(-2));
    } else {
      if (this.fullHours < 100)
        arr.push(('00' + this.fullHours).slice(-2));
      else
        arr.push(this.fullHours.toString());
    }
    arr.push(('00' + this.minutes).slice(-2));
    arr.push(('00' + this.seconds).slice(-2));
    return arr.join(separator);
  }
  FormatToJP(days?: boolean, separator = "") {
    const arr: string[] = [];
    if (days) {
      if (this.days) arr.push(this.days + "日");
      if (this.hours) arr.push(this.hours + "時間");
    } else {
      if (this.fullHours) arr.push(this.fullHours + "時間");
    }
    if (this.minutes) arr.push(this.minutes + "分");
    if (this.seconds) arr.push(this.seconds + "秒");
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
