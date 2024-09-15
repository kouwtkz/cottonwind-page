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

/** @mothod default: POST */
export async function corsFetchJSON(input: string | URL | globalThis.Request, body: Object, { method = "POST", ...init }: initType = {}) {
  return corsFetch(input, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    method,
    ...init
  })
}