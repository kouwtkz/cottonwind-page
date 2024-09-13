export type methodType = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
interface initType extends RequestInit {
  method?: methodType;
  headers?: ContentTypeHeader;
}
export async function corsFetch(input: string | URL | globalThis.Request, init?: initType) {
  return fetch(input, {
    mode: "cors",
    credentials: "include",
    ...init
  })
}