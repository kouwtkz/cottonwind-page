interface FilesRecordDataType {
  id?: number;
  key: string;
  src?: string;
  private?: number;
  mtime?: string;
  lastmod?: string;
}

interface FilesRecordIndexedDataType extends FilesRecordDataType, WithRawExtendDataType<FilesRecordDataType> {
  private?: boolean;
}

interface FilesRecordType extends Omit<FilesRecordIndexedDataType, "mtime" | "lastmod"> {
  mtime?: Temporal.ZonedDateTime;
  lastmod?: Temporal.ZonedDateTime;
  dir?: string;
}

interface UploadBaseProps {
  files: File[];
  dir?: string;
  private?: boolean;
  key?: string | string[];
}

interface FilesUploadProps extends UploadBaseProps {
  send?: string;
  sleepTime?: number;
  minTime?: number;
}
