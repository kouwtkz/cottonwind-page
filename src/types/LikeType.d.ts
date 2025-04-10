interface LikeDataType {
  path: string;
  count: number;
  registed: string;
  lastmod: string;
}

interface LikeType extends Partial<LikeDataType>, WithRawDataType<LikeDataType> {
  checked?: boolean;
}

interface LikeFormType {
  path: string;
  mode: "add" | "remove";
}