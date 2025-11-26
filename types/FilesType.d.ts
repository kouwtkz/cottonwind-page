interface FilesRecordDataType {
  id?: number;
  key: string;
  src?: string;
  private?: number;
  mtime?: string;
  lastmod?: string;
}

interface FilesRecordType extends FilesRecordDataType, WithRawDataType<FilesRecordDataType> {
  private?: boolean;
  mtime?: Date;
  lastmod?: Date;
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
