interface KeyValueDBType {
  key: string;
  value: string;
  lastmod: string;
}

interface KeyValueSendType extends Partial<KeyValueDBType> {
  update?: string;
}
