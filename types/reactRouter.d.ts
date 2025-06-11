interface RouterMatchesType<T = any> {
  id: string;
  params: Record<string, string | undefined>;
  pathname: string;
  meta: MetaValuesType[];
  data: T;
  handle?: unknown;
}