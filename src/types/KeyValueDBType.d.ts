interface KeyValueDBDataType {
  key: string;
  value?: string;
  private?: number;
  lastmod: string;
}

interface KeyValueDBType extends KeyValueDBDataType {
  private?: boolean;
}

interface KeyValueSendType extends Partial<KeyValueDBType> {
  update?: string;
}
