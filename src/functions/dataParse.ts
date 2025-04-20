export function dataParse<T extends object>(data: any): T {
  if (typeof data === "string" && data.startsWith("{")) {
    return JSON.parse(data);
  } else return {} as T;
}
