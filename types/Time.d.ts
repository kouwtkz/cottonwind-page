declare class TimeClass {
  value: string;
  time: number;
  days: number;
  dayHours: number;
  hours: number;
  dayMinutes: number;
  minutes: number;
  daySeconds: number;
  seconds: number;
  formattedValue: string;
  FormatValue(days?: boolean, separator?: string): string;
  FormatToJP(days?: boolean, separator?: string): string;
  constructor(value?: string | number): void;
  SetValue(value?: string | number): void;
  static Parse(value: string | number): [number, number, number, number];
}
