interface redirectDataType {
  id: number;
  path: string;
  redirect: string;
  lastmod: string;
  private: number;
}

interface redirectIndexedDataType extends redirectDataType, WithRawExtendDataType<redirectDataType> {
  private?: boolean;
}

interface redirectType extends Omit<redirectIndexedDataType, "lastmod"> {
  lastmod?: Temporal.ZonedDateTime;
}

interface redirectSendType extends Partial<redirectDataType> {
  id?: number;
  update?: string;
}
