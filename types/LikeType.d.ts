interface LikeDataType {
  path: string;
  count: number;
  registed: string;
  lastmod: string;
}

interface LikeType extends Partial<LikeDataType>, WithRawExtendDataType<LikeDataType> {
  checked?: boolean;
}

interface LikeFormType {
  path: string;
  mode: "add" | "remove";
}