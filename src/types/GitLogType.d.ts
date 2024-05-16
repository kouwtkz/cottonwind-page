interface GitItemType {
  date: string;
  messages: string[];
}

interface GitObjectType {
  remote_url?: string;
  list: GitItemType[];
}

interface GitLogDataType {
  ymd: string;
  date: Date;
  message: string;
}