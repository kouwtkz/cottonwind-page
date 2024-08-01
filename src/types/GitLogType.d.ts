interface GitItemJsonType {
  date: string;
  messages: string[];
}

interface GitObjectJsonType {
  remote_url?: string;
  list: GitItemJsonType[];
}

interface GitItemType extends GitItemJsonType {
  year: number;
  month: number;
  day: number;
}

type KeyMonthDicType = { [month: number]: GitItemType[] };
type KeyYearDicType = { [year: number]: KeyMonthDicType };

type KeyMonthType = { month: number; value: GitItemType[]; };
type KeyYearType = { year: number; value: KeyMonthType[]; };

interface GitObjectType {
  remote_url?: string;
  list: GitItemType[];
  lastUpdate?: string;
  ymlist: KeyYearType[];
}

interface GitLogItemType {
  ymd: string;
  date: Date;
  message: string;
}

interface GitLogDataType {
  remote_url?: string;
  list: GitLogItemType[];
}
