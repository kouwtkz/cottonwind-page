interface RouterMatchesType<T = any> {
  id: string;
  params: Record<string, string | undefined>;
  pathname: string;
  data: T;
  handle: unknown;
}