interface redirectDataType {
  id: number;
  path: string;
  redirect: string;
  lastmod: string;
}

interface redirectType extends redirectDataType, WithRawDataType<redirectDataType> {
  private?: boolean;
  lastmod?: Date;
}

interface redirectSendType extends Partial<redirectDataType> {
  id?: number;
  update?: string;
}
