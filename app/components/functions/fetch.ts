export type methodType = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface initType extends RequestInit {
  body?: any;
  method?: methodType;
  headers?: ContentTypeHeader;
  timeout?: number;
  cors?: boolean;
}
export async function customFetch(input: string | URL | globalThis.Request, { cors, timeout, method, body, headers = {}, ...init }: initType = {}) {
  if (cors) {
    init.mode = "cors";
    init.credentials = "include";
  }
  const isFormData = body && (body instanceof FormData);
  if (body && !isFormData) {
    headers["Content-Type"] = "application/json";
    if (typeof body !== "string") body = JSON.stringify(body);
  }
  let timeoutTimer: NodeJS.Timeout | undefined;
  try {
    if (timeout) {
      const controller = new AbortController();
      timeoutTimer = setTimeout(() => { controller.abort() }, timeout || 15000)
    }
    const response = await fetch(input, { method, body, headers, ...init });
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
export async function customFetchPost(input: string | URL | globalThis.Request, body: Object, { method = "POST", ...init }: initType = {}) {
  return corsFetch(input, {
    method,
    ...init
  })
}

export async function corsFetch(input: string | URL | globalThis.Request, init?: initType) {
  return customFetch(input, { cors: true, ...init });
}

/** @mothod default: POST */
export async function corsFetchPost(input: string | URL | globalThis.Request, body: Object, { method = "POST", ...init }: initType = {}) {
  return customFetchPost(input, body, { cors: true, ...init });
}
