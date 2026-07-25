interface KeyValueDBDataType {
  key: string;
  value?: string;
  private?: number;
  lastmod: string;
}

interface KeyValueDBIndexedDataType extends KeyValueDBDataType, WithRawExtendDataType<KeyValueDBDataType> {
  private?: boolean;
}
interface KeyValueDBType extends KeyValueDBIndexedDataType {
}

interface KeyValueSendType extends Partial<KeyValueDBType> {
  update?: string;
}
