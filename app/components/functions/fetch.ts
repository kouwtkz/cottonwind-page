export type methodType = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface initType extends RequestInit {
  body?: any;
  method?: methodType;
  headers?: ContentTypeHeader;
  timeout?: number;
  cors?: boolean;
}
export async function customFetch(input: string | URL | globalThis.Request, { cors, timeout, method, body, ...init }: initType = {}) {
  if (cors) {
    init.mode = "cors";
    init.credentials = "include";
  }
  if (method !== "POST" && body && !(body instanceof FormData)) {
    const formData = new FormData();
    Object.entries<any>(body).forEach(([k, v]) => {
      formData.append(k, v);
    });
    body = formData;
  }
  let timeoutTimer: NodeJS.Timeout | undefined;
  try {
    if (timeout) {
      const controller = new AbortController();
      timeoutTimer = setTimeout(() => { controller.abort() }, timeout || 15000)
    }
    const response = await fetch(input, { method, body, ...init });
    if (!response.ok) {
      console.error(response.text);
      return response;
    }
    return response;
  } finally {
    if (typeof timeoutTimer !== "undefined") clearTimeout(timeoutTimer);
  }
}

/** @mothod default: POST */
export async function customFetchJSON(input: string | URL | globalThis.Request, body: Object, { method = "POST", ...init }: initType = {}) {
  return corsFetch(input, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    method,
    ...init
  })
}

export async function corsFetch(input: string | URL | globalThis.Request, init?: initType) {
  return customFetch(input, { cors: true, ...init });
}

/** @mothod default: POST */
export async function corsFetchJSON(input: string | URL | globalThis.Request, body: Object, { method = "POST", ...init }: initType = {}) {
  return customFetchJSON(input, body, { cors: true, ...init });
}
