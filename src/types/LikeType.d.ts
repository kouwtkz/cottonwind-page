interface LikeDataType {
  path: string;
  count: number;
  registed: string;
  lastmod: string;
}

interface LikeType extends Partial<LikeDataType> {
  check?: boolean;
}

interface LikeFormType {
  path: string;
}