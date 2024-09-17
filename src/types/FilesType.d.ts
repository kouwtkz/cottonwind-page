interface FilesRecordDataType {
  id?: number;
  key: string;
  src?: string;
  private?: number;
  mtime?: string;
  lastmod?: string;
}

interface FilesRecordType extends FilesRecordDataType {
  private?: boolean;
  mtime?: Date;
  lastmod?: Date;
}

interface UploadBaseProps {
  files: File[];
  apiOrigin?: string;
}

interface FilesUploadProps extends UploadBaseProps {
  path: string;
  interval?: number;
}
