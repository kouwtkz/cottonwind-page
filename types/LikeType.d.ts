interface LikeDataType {
  path: string;
  count: number;
  registed: string;
  lastmod: string;
}

interface LikeIndexedDataType extends Partial<LikeDataType>, WithRawExtendDataType<LikeDataType> {
  checked?: boolean;
}

interface LikeType extends LikeIndexedDataType {
}

interface LikeFormType {
  path: string;
  mode: "add" | "remove";
}